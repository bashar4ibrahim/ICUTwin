import { requestJson } from './api';

export const CUSTOM_AI_MODEL_ID = import.meta.env.VITE_CUSTOM_AI_MODEL_ID || 'neocare-mortality';
export const CUSTOM_AI_MODEL_NAME =
  import.meta.env.VITE_CUSTOM_AI_MODEL_NAME || 'NEOcare Mortality Prediction';
export const CUSTOM_AI_MODEL_ENDPOINT =
  import.meta.env.VITE_CUSTOM_AI_MODEL_ENDPOINT || '/icu/ai/risk';

const MODEL_SOURCE = 'ICU Digital Twin';
const ONE_DECIMAL_FIELDS = new Set(['temperature_celsius', 'glucose', 'creatinine', 'wbc', 'lactate', 'map']);

export const CUSTOM_MODEL_INPUT_GROUPS = [
  {
    title: 'Patient Snapshot',
    description: 'Core vitals available in the digital twin.',
    fields: [
      { key: 'age', label: 'Age', unit: 'years', min: 0, max: 120, required: true },
      { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', min: 0, max: 240, required: true },
      { key: 'systolic_bp', label: 'Systolic BP', unit: 'mmHg', min: 0, max: 300, required: true },
      { key: 'diastolic_bp', label: 'Diastolic BP', unit: 'mmHg', min: 0, max: 220, required: true },
      { key: 'map', label: 'MAP Override', unit: 'mmHg', min: 0, max: 200, required: false },
      { key: 'respiratory_rate', label: 'Resp Rate', unit: '/min', min: 0, max: 80, required: true },
      { key: 'temperature_celsius', label: 'Temperature', unit: 'C', min: 25, max: 45, required: true },
      { key: 'spo2', label: 'SpO2', unit: '%', min: 0, max: 100, required: true },
    ],
  },
  {
    title: 'Clinical Labs',
    description: 'Required features that are not currently streamed in the UI.',
    fields: [
      { key: 'glucose', label: 'Glucose', unit: 'mg/dL', min: 0, max: 600, required: true },
      { key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', min: 0, max: 20, required: true },
      { key: 'wbc', label: 'WBC', unit: '10^9/L', min: 0, max: 100, required: true },
      { key: 'lactate', label: 'Lactate', unit: 'mmol/L', min: 0, max: 20, required: true },
    ],
  },
];

export const CUSTOM_MODEL_MOCK_CASES = [
  {
    id: 'high-risk',
    label: 'Load High Risk',
    description: 'Septic-shock style case with elevated lactate and renal strain.',
    inputs: {
      age: 67,
      heart_rate: 118,
      systolic_bp: 92,
      diastolic_bp: 58,
      map: 69.3,
      respiratory_rate: 28,
      temperature_celsius: 38.4,
      spo2: 90,
      glucose: 178,
      creatinine: 1.9,
      wbc: 16.8,
      lactate: 4.6,
    },
  },
  {
    id: 'lower-risk',
    label: 'Load Lower Risk',
    description: 'More stable ICU snapshot for a comparison run.',
    inputs: {
      age: 54,
      heart_rate: 86,
      systolic_bp: 124,
      diastolic_bp: 78,
      map: 93.3,
      respiratory_rate: 18,
      temperature_celsius: 37.1,
      spo2: 97,
      glucose: 112,
      creatinine: 1.0,
      wbc: 8.4,
      lactate: 1.2,
    },
  },
];

const REQUIRED_INPUT_KEYS = CUSTOM_MODEL_INPUT_GROUPS.flatMap((group) =>
  group.fields.filter((field) => field.required).map((field) => field.key)
);

const roundValue = (value, digits = 1) => {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
};

const toNumericOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeFormValue = (key, value) => {
  if (value === '' || value === null || value === undefined) return '';
  const numeric = toNumericOrNull(value);
  if (numeric === null) return '';
  return ONE_DECIMAL_FIELDS.has(key) ? roundValue(numeric, 1) ?? '' : Math.round(numeric);
};

const computeMap = (systolicBp, diastolicBp, explicitMap) => {
  const map = toNumericOrNull(explicitMap);
  if (map !== null) return roundValue(map, 1);

  const systolic = toNumericOrNull(systolicBp);
  const diastolic = toNumericOrNull(diastolicBp);
  if (systolic === null || diastolic === null) return null;

  return roundValue((systolic + (2 * diastolic)) / 3, 1);
};

const sanitizeText = (value, fallback = 'Unknown') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const sanitizeList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

const sanitizeFeatureAttributions = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (typeof item === 'string') {
        const label = item.trim();
        return label
          ? {
              feature: `factor_${index + 1}`,
              label,
              impact: null,
              direction: 'positive',
            }
          : null;
      }

      if (!item || typeof item !== 'object') return null;

      const feature = sanitizeText(
        pickFirstDefined(item.feature, item.name, item.key),
        `factor_${index + 1}`
      );
      const label = sanitizeText(
        pickFirstDefined(item.label, item.description, item.feature, item.name),
        feature
      );
      const impact = normalizeNumber(pickFirstDefined(item.impact, item.weight, item.score));
      const rawDirection = sanitizeText(item.direction, impact !== null && impact < 0 ? 'negative' : 'positive');

      return {
        feature,
        label,
        impact,
        direction: rawDirection.toLowerCase(),
      };
    })
    .filter(Boolean);
};

const normalizeProbability = (value) => {
  const numeric = toNumericOrNull(value);
  if (numeric === null) return null;
  const probability = numeric > 1 ? numeric / 100 : numeric;
  return Math.max(0, Math.min(1, probability));
};

const normalizePercent = (value) => {
  const probability = normalizeProbability(value);
  return probability === null ? null : roundValue(probability * 100, 1);
};

const normalizeScore = (value) => {
  const numeric = toNumericOrNull(value);
  if (numeric === null) return null;
  return roundValue(numeric > 100 ? 100 : numeric, 1);
};

const normalizeNumber = (value) => {
  const numeric = toNumericOrNull(value);
  if (numeric === null) return null;
  return roundValue(numeric, 1);
};

const pickFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const getFieldLabel = (key) =>
  CUSTOM_MODEL_INPUT_GROUPS.flatMap((group) => group.fields).find((field) => field.key === key)?.label || key;

export const getDefaultCustomModelInputs = (patient) => ({
  age: normalizeFormValue('age', patient?.age),
  heart_rate: normalizeFormValue('heart_rate', patient?.latest_vitals?.heart_rate),
  systolic_bp: normalizeFormValue('systolic_bp', patient?.latest_vitals?.blood_pressure_sys),
  diastolic_bp: normalizeFormValue('diastolic_bp', patient?.latest_vitals?.blood_pressure_dia),
  map: normalizeFormValue('map', computeMap(
    patient?.latest_vitals?.blood_pressure_sys,
    patient?.latest_vitals?.blood_pressure_dia,
    patient?.latest_vitals?.map
  )),
  respiratory_rate: normalizeFormValue('respiratory_rate', patient?.latest_vitals?.respiratory_rate),
  temperature_celsius: normalizeFormValue('temperature_celsius', patient?.latest_vitals?.temperature),
  spo2: normalizeFormValue('spo2', patient?.latest_vitals?.spo2),
  glucose: '',
  creatinine: '',
  wbc: '',
  lactate: '',
});

export const createCustomModelDraft = (patient, existingDraft = {}) => ({
  ...getDefaultCustomModelInputs(patient),
  ...existingDraft,
});

export const prepareCustomModelRequest = ({ patient, inputs }) => {
  const draft = createCustomModelDraft(patient, inputs);
  const featureVector = {
    Age: toNumericOrNull(draft.age),
    HR: toNumericOrNull(draft.heart_rate),
    SysBP: toNumericOrNull(draft.systolic_bp),
    DiasBP: toNumericOrNull(draft.diastolic_bp),
    MAP: computeMap(draft.systolic_bp, draft.diastolic_bp, draft.map),
    RespRate: toNumericOrNull(draft.respiratory_rate),
    Temp: toNumericOrNull(draft.temperature_celsius),
    SpO2: toNumericOrNull(draft.spo2),
    Glucose: toNumericOrNull(draft.glucose),
    Creatinine: toNumericOrNull(draft.creatinine),
    WBC: toNumericOrNull(draft.wbc),
    Lactate: toNumericOrNull(draft.lactate),
  };

  const missingFields = REQUIRED_INPUT_KEYS.filter((key) => {
    const mapValue = key === 'map' ? featureVector.MAP : null;
    if (key === 'map') return mapValue === null;

    const vectorKeyMap = {
      age: 'Age',
      heart_rate: 'HR',
      systolic_bp: 'SysBP',
      diastolic_bp: 'DiasBP',
      respiratory_rate: 'RespRate',
      temperature_celsius: 'Temp',
      spo2: 'SpO2',
      glucose: 'Glucose',
      creatinine: 'Creatinine',
      wbc: 'WBC',
      lactate: 'Lactate',
    };

    return featureVector[vectorKeyMap[key]] === null;
  });

  return {
    missingFields,
    payload: {
      model_id: CUSTOM_AI_MODEL_ID,
      model_name: CUSTOM_AI_MODEL_NAME,
      patient: {
        patient_id: patient?.patient_id || null,
        name: patient?.name || null,
        age: featureVector.Age,
        gender: patient?.gender || null,
        diagnosis: patient?.diagnosis || null,
        status: patient?.status || null,
      },
      icu: {
        bed_id: patient?.bed_id || null,
        source: MODEL_SOURCE,
        requested_at: new Date().toISOString(),
      },
      vitals: {
        heart_rate: featureVector.HR,
        systolic_bp: featureVector.SysBP,
        diastolic_bp: featureVector.DiasBP,
        map: featureVector.MAP,
        respiratory_rate: featureVector.RespRate,
        temperature_celsius: featureVector.Temp,
        spo2: featureVector.SpO2,
      },
      labs: {
        glucose: featureVector.Glucose,
        creatinine: featureVector.Creatinine,
        wbc: featureVector.WBC,
        lactate: featureVector.Lactate,
      },
      feature_vector: featureVector,
      metadata: {
        source_app: 'icu-digital-twin-frontend',
        page: 'ai-risk-engine',
      },
    },
  };
};

export const normalizeCustomModelPrediction = (response, payload = null) => {
  const riskAssessment = response?.risk_assessment || {};
  const modelInfo = response?.model_info || {};
  const deathProb7d = normalizeProbability(
    pickFirstDefined(riskAssessment.death_prob_7d, response?.death_prob_7d, response?.probability_7d)
  );
  const deathProb30d = normalizeProbability(
    pickFirstDefined(riskAssessment.death_prob_30d, response?.death_prob_30d, response?.probability_30d)
  );
  const riskPercentage =
    normalizePercent(
      pickFirstDefined(
        riskAssessment.risk_percentage,
        response?.risk_percentage,
        response?.probability,
        deathProb7d
      )
    ) ?? 0;
  const overallScore =
    normalizeScore(
      pickFirstDefined(
        riskAssessment.overall_score,
        riskAssessment.risk_score,
        response?.risk_score,
        response?.overall_score,
        riskPercentage
      )
    ) ?? riskPercentage;
  const confidence = normalizePercent(
    pickFirstDefined(response?.confidence, riskAssessment.confidence, response?.confidence_score)
  );
  const classification =
    sanitizeText(
      pickFirstDefined(
        response?.classification_label,
        response?.classification,
        riskAssessment.category,
        riskAssessment.risk_level,
        response?.risk_level
      ),
      'Prediction available'
    );

  const contributingFactors = sanitizeList(
    pickFirstDefined(response?.contributing_factors, response?.risk_factors, response?.top_features)
  );
  const recommendations = sanitizeList(
    pickFirstDefined(response?.recommended_actions, response?.recommendations)
  );
  const clinicalAlerts = sanitizeList(response?.clinical_alerts);
  const featureAttributions = sanitizeFeatureAttributions(
    pickFirstDefined(response?.feature_attribution, response?.feature_attributions, response?.explainability?.feature_attribution)
  );
  const riskLowerBound = normalizePercent(
    pickFirstDefined(
      response?.uncertainty?.risk_lower,
      response?.uncertainty?.lower_bound,
      response?.risk_bounds?.lower,
      response?.confidence_interval?.lower
    )
  );
  const riskUpperBound = normalizePercent(
    pickFirstDefined(
      response?.uncertainty?.risk_upper,
      response?.uncertainty?.upper_bound,
      response?.risk_bounds?.upper,
      response?.confidence_interval?.upper
    )
  );
  const expectedDaysToEvent = normalizeNumber(
    pickFirstDefined(
      response?.time_to_event_days,
      response?.time_to_event_estimate?.expected_days,
      response?.time_to_event_estimate?.days,
      response?.timeline?.expected_days
    )
  );
  const cohortRelativeRisk = normalizeNumber(
    pickFirstDefined(
      response?.cohort_comparison?.relative_risk,
      response?.cohort_comparison?.relativeRisk
    )
  );
  const cohortPercentile = normalizePercent(
    pickFirstDefined(
      response?.cohort_comparison?.percentile,
      response?.cohort_comparison?.risk_percentile
    )
  );

  return {
    model: {
      id: CUSTOM_AI_MODEL_ID,
      name: sanitizeText(pickFirstDefined(modelInfo.model, modelInfo.model_type, CUSTOM_AI_MODEL_NAME)),
      endpoint: CUSTOM_AI_MODEL_ENDPOINT,
      source: MODEL_SOURCE,
    },
    risk: {
      overallScore,
      riskPercentage,
      classification,
      confidence,
      deathProb7d: deathProb7d === null ? null : roundValue(deathProb7d * 100, 1),
      deathProb30d: deathProb30d === null ? null : roundValue(deathProb30d * 100, 1),
      survival7d: normalizePercent(pickFirstDefined(riskAssessment.survival_7d, response?.survival_7d)),
      survival30d: normalizePercent(pickFirstDefined(riskAssessment.survival_30d, response?.survival_30d)),
      medianSurvivalDays: normalizeNumber(
        pickFirstDefined(riskAssessment.median_survival_days, response?.median_survival_days)
      ),
      label: sanitizeText(
        pickFirstDefined(
          riskAssessment.risk_level,
          riskAssessment.category,
          response?.risk_level,
          response?.classification_label
        ),
        classification
      ),
    },
    factors: contributingFactors,
    recommendations,
    alerts: clinicalAlerts,
    survivalCurve: {
      timePoints: Array.isArray(response?.survival_curve?.time_points)
        ? response.survival_curve.time_points.filter((value) => Number.isFinite(Number(value))).map(Number)
        : [],
      survivalProbabilities: Array.isArray(response?.survival_curve?.survival_probabilities)
        ? response.survival_curve.survival_probabilities
            .map((value) => normalizePercent(value))
            .filter((value) => value !== null)
        : [],
    },
    advanced: {
      uncertainty: {
        lowerRisk: riskLowerBound,
        upperRisk: riskUpperBound,
        bandLabel: sanitizeText(
          pickFirstDefined(response?.uncertainty?.label, response?.uncertainty?.summary),
          'Not provided'
        ),
      },
      timeToEvent: {
        expectedDays: expectedDaysToEvent,
        label: sanitizeText(
          pickFirstDefined(response?.time_to_event_estimate?.label, response?.timeline?.label),
          expectedDaysToEvent === null ? 'Not provided' : 'Estimated time to event'
        ),
      },
      featureAttributions,
      cohortComparison: {
        cohort: sanitizeText(
          pickFirstDefined(response?.cohort_comparison?.cohort, response?.cohort_comparison?.group_name),
          'ICU baseline cohort'
        ),
        relativeRisk: cohortRelativeRisk,
        percentile: cohortPercentile,
      },
    },
    payload,
    raw: response,
  };
};

export async function predictCustomAiModel({ patient, inputs }) {
  // Use advanced TurboQuant + CKKS engine if available
  if (patient?.patient_id) {
    try {
      // Try advanced engine first (TurboQuant + CKKS) - matches your FastAPI router
      const response = await requestJson(`/icu/ai/risk/${patient.patient_id}?use_turboquant=true`);

      // Check if TurboQuant was actually used (from your router's response)
      if (response.turboquant?.enabled) {
        return normalizeCustomModelPrediction(response, { patient });
      } else {
        // TurboQuant not available, use standard response
        return normalizeCustomModelPrediction(response, { patient });
      }

    } catch (advancedError) {
      console.warn('Advanced engine not available, falling back to standard endpoint:', advancedError.message);

      // Fallback to standard production endpoint
      try {
        const response = await requestJson(`/icu/ai/risk/${patient.patient_id}`);
        return normalizeCustomModelPrediction(response, { patient });
      } catch (fallbackError) {
        console.error('Both advanced and standard engines failed:', fallbackError);
        throw new Error('Unable to get risk prediction from any engine');
      }
    }
  }

  // Fallback to custom model request for non-production environments
  const { missingFields, payload } = prepareCustomModelRequest({ patient, inputs });

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.map(getFieldLabel).join(', ')}`);
  }

<<<<<<< x_ray
  // The backend uses GET /icu/ai/risk/{patient_id} endpoint
  const endpoint = `${CUSTOM_AI_MODEL_ENDPOINT}/${patient?.patient_id}`;
  const response = await requestJson(endpoint, {
    method: 'GET',
=======
  const response = await requestJson(CUSTOM_AI_MODEL_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
>>>>>>> main
  });

  return normalizeCustomModelPrediction(response, payload);
}
