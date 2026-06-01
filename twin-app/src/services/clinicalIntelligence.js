export const CLINICAL_INTELLIGENCE_STORAGE_KEY = 'icu_clinical_intelligence_v1';
export const AUTO_PREDICTION_DEBOUNCE_MS = 300;
// JOB 1: GUESS missing lab data         → "What labs would this patient likely have?"
// JOB 2: GATHER all 12 inputs           → "Collect everything the AI model needs"
// JOB 3: DECIDE what happened           → "Is it getting worse? Should we alert someone?"
// JOB 4: RECORD everything              → "Log it, package it, store it"
// JOB 5: ANSWER chatbot questions       → "Which patient is at risk?"
const PROFILE_DEFAULTS = {
  default: { glucose: 118, creatinine: 1.1, wbc: 8.4, lactate: 1.6 },
  critical: { glucose: 156, creatinine: 1.7, wbc: 14.2, lactate: 3.6 },
  stable: { glucose: 112, creatinine: 1.0, wbc: 7.9, lactate: 1.3 },
  sepsis: { glucose: 176, creatinine: 1.8, wbc: 16.4, lactate: 4.2 },
  respiratory: { glucose: 132, creatinine: 1.2, wbc: 11.2, lactate: 2.2 },
  renal: { glucose: 128, creatinine: 2.3, wbc: 10.4, lactate: 2.5 },
};

const round = (value, digits = 1) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Number(numeric.toFixed(digits));
};

const toNumericOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getDiagnosisProfile = (patient) => {
  const diagnosis = `${patient?.diagnosis || ''}`.toLowerCase();
  if (diagnosis.includes('septic')) return 'sepsis';
  if (diagnosis.includes('respir')) return 'respiratory';
  if (diagnosis.includes('renal') || diagnosis.includes('kidney')) return 'renal';
  if (patient?.status === 'critical') return 'critical';
  if (patient?.status === 'stable') return 'stable';
  return 'default';
};

export const getEstimatedLabProfile = (patient) => {
  const profile = PROFILE_DEFAULTS[getDiagnosisProfile(patient)] || PROFILE_DEFAULTS.default;
  return { ...profile };
};

const buildMap = (sysBp, diaBp, explicitMap) => {
  const map = toNumericOrNull(explicitMap);
  if (map !== null) return round(map, 1);
  const systolic = toNumericOrNull(sysBp);
  const diastolic = toNumericOrNull(diaBp);
  if (systolic === null || diastolic === null) return null;
  return round((systolic + (2 * diastolic)) / 3, 1);
};

export const assembleAutoModelInputs = (patient, storedInputs = {}) => {
  const live = patient?.latest_vitals || {};
  const estimatedLabs = getEstimatedLabProfile(patient);

  const inputs = {
    age: toNumericOrNull(storedInputs.age) ?? toNumericOrNull(patient?.age),
    heart_rate: toNumericOrNull(storedInputs.heart_rate) ?? toNumericOrNull(live.heart_rate),
    systolic_bp: toNumericOrNull(storedInputs.systolic_bp) ?? toNumericOrNull(live.blood_pressure_sys),
    diastolic_bp: toNumericOrNull(storedInputs.diastolic_bp) ?? toNumericOrNull(live.blood_pressure_dia),
    map: buildMap(
      toNumericOrNull(storedInputs.systolic_bp) ?? toNumericOrNull(live.blood_pressure_sys),
      toNumericOrNull(storedInputs.diastolic_bp) ?? toNumericOrNull(live.blood_pressure_dia),
      toNumericOrNull(storedInputs.map) ?? toNumericOrNull(live.map)
    ),
    respiratory_rate: toNumericOrNull(storedInputs.respiratory_rate) ?? toNumericOrNull(live.respiratory_rate),
    temperature_celsius: toNumericOrNull(storedInputs.temperature_celsius) ?? toNumericOrNull(live.temperature),
    spo2: toNumericOrNull(storedInputs.spo2) ?? toNumericOrNull(live.spo2),
    glucose: toNumericOrNull(storedInputs.glucose) ?? estimatedLabs.glucose,
    creatinine: toNumericOrNull(storedInputs.creatinine) ?? estimatedLabs.creatinine,
    wbc: toNumericOrNull(storedInputs.wbc) ?? estimatedLabs.wbc,
    lactate: toNumericOrNull(storedInputs.lactate) ?? estimatedLabs.lactate,
  };

  const sources = {
    age: toNumericOrNull(storedInputs.age) !== null ? 'manual' : 'patient',
    heart_rate: toNumericOrNull(storedInputs.heart_rate) !== null ? 'manual' : 'live_vitals',
    systolic_bp: toNumericOrNull(storedInputs.systolic_bp) !== null ? 'manual' : 'live_vitals',
    diastolic_bp: toNumericOrNull(storedInputs.diastolic_bp) !== null ? 'manual' : 'live_vitals',
    map: toNumericOrNull(storedInputs.map) !== null ? 'manual' : 'derived',
    respiratory_rate: toNumericOrNull(storedInputs.respiratory_rate) !== null ? 'manual' : 'live_vitals',
    temperature_celsius: toNumericOrNull(storedInputs.temperature_celsius) !== null ? 'manual' : 'live_vitals',
    spo2: toNumericOrNull(storedInputs.spo2) !== null ? 'manual' : 'live_vitals',
    glucose: toNumericOrNull(storedInputs.glucose) !== null ? 'manual' : 'estimated_profile',
    creatinine: toNumericOrNull(storedInputs.creatinine) !== null ? 'manual' : 'estimated_profile',
    wbc: toNumericOrNull(storedInputs.wbc) !== null ? 'manual' : 'estimated_profile',
    lactate: toNumericOrNull(storedInputs.lactate) !== null ? 'manual' : 'estimated_profile',
  };

  return { inputs, sources };
};

export const buildPredictionSignature = (patient, assembled) =>
  JSON.stringify({
    patient_id: patient?.patient_id || null,
    status: patient?.status || null,
    diagnosis: patient?.diagnosis || null,
    bed_id: patient?.bed_id || null,
    inputs: assembled?.inputs || {},
  });

export const mergePatientSnapshot = (previous = {}, patientPatch = {}) => ({
  ...previous,
  ...patientPatch,
  latest_vitals: {
    ...(previous.latest_vitals || {}),
    ...(patientPatch.latest_vitals || {}),
  },
  model_inputs: {
    ...(previous.model_inputs || {}),
    ...(patientPatch.model_inputs || {}),
  },
  model_input_sources: {
    ...(previous.model_input_sources || {}),
    ...(patientPatch.model_input_sources || {}),
  },
});

export const summarizeTrend = (history = []) => {
  if (history.length < 2) return { delta: 0, direction: 'flat' };
  const previous = history[history.length - 2]?.risk?.riskPercentage ?? 0;
  const current = history[history.length - 1]?.risk?.riskPercentage ?? 0;
  const delta = round(current - previous, 1) ?? 0;
  if (delta > 2) return { delta, direction: 'up' };
  if (delta < -2) return { delta, direction: 'down' };
  return { delta, direction: 'flat' };
};

export const buildSyntheticAlert = (patient, prediction, history = []) => {
  const risk = prediction?.risk || {};
  const trend = summarizeTrend(history);
  const reasons = [];

  if ((risk.riskPercentage ?? 0) >= 65) reasons.push('risk_threshold');
  if ((risk.deathProb7d ?? 0) >= 40) reasons.push('mortality_threshold');
  if (trend.delta >= 10) reasons.push('rapid_worsening');
  if ((prediction?.alerts || []).length > 0) reasons.push('clinical_alerts');

  if (reasons.length === 0) return null;

  return {
    alert_id: `synthetic-${patient.patient_id}-${prediction.generatedAt || Date.now()}`,
    patient_id: patient.patient_id,
    name: patient.name,
    bed_id: patient.bed_id,
    category: risk.label || risk.classification || 'MODEL ALERT',
    risk_score: risk.overallScore ?? risk.riskPercentage ?? 0,
    top_factor: prediction.factors?.[0] || 'Model threshold exceeded',
    severity: (risk.riskPercentage ?? 0) >= 80 ? 'CRITICAL' : 'HIGH',
    reasons,
    generated_at: prediction.generatedAt || new Date().toISOString(),
  };
};

export const buildEscalation = (prediction, history = []) => {
  const trend = summarizeTrend(history);
  const risk = prediction?.risk || {};

  if ((risk.riskPercentage ?? 0) >= 80 || trend.delta >= 15) {
    return {
      level: 'Immediate',
      message: 'Escalate to the attending ICU team now.',
    };
  }

  if ((risk.riskPercentage ?? 0) >= 60 || trend.delta >= 8) {
    return {
      level: 'Urgent',
      message: 'Repeat assessment and clinician review are recommended.',
    };
  }

  return {
    level: 'Routine',
    message: 'Continue monitoring and trend the patient closely.',
  };
};

export const buildAuditEntry = ({ patient, prediction, reason, history }) => {
  const trend = summarizeTrend(history);
  return {
    audit_id: `audit-${patient.patient_id}-${Date.now()}`,
    patient_id: patient.patient_id,
    patient_name: patient.name,
    action: reason === 'manual' ? 'Manual Model Run' : 'Auto Model Refresh',
    risk_percentage: prediction?.risk?.riskPercentage ?? null,
    classification: prediction?.risk?.label || prediction?.risk?.classification || 'Unknown',
    trend_delta: trend.delta,
    at: new Date().toISOString(),
  };
};

export const createPredictionRecord = (prediction, context = {}) => ({
  ...prediction,
  generatedAt: context.generatedAt || new Date().toISOString(),
  generationReason: context.reason || 'auto',
  inputSources: context.inputSources || {},
  escalation: context.escalation || null,
});

export const getRiskTone = (riskPercentage = 0) => {
  if (riskPercentage >= 70) return 'critical';
  if (riskPercentage >= 40) return 'warning';
  return 'stable';
};

const extractPatientIdFromQuery = (query, patients = []) => {
  const upper = query.toUpperCase();
  const exactId = patients.find((patient) => upper.includes((patient.patient_id || '').toUpperCase()));
  if (exactId) return exactId.patient_id;

  const byName = patients.find((patient) =>
    query.toLowerCase().includes((patient.name || '').toLowerCase())
  );
  return byName?.patient_id || null;
};

const formatPredictionLine = (patient, prediction, history) => {
  if (!prediction) return `${patient.name}: no model prediction is available yet.`;
  const trend = summarizeTrend(history);
  const deltaText =
    trend.direction === 'flat' ? 'stable from the last run' : `${trend.direction === 'up' ? 'up' : 'down'} ${Math.abs(trend.delta)} points from the last run`;
  return `${patient.name} is ${prediction.risk.label || prediction.risk.classification} with ${prediction.risk.riskPercentage}% predicted 7-day mortality risk, ${deltaText}.`;
};

export const answerClinicalQuestion = ({ query, snapshots, predictions, history, alerts }) => {
  const normalized = query.trim().toLowerCase();
  const patients = Object.values(snapshots || {});

  if (!normalized) return null;

  if (normalized.includes('which patient') || normalized.includes('at risk') || normalized.includes('highest risk')) {
    const ranked = patients
      .map((patient) => ({ patient, prediction: predictions?.[patient.patient_id] }))
      .filter((item) => item.prediction)
      .sort((a, b) => (b.prediction.risk.riskPercentage || 0) - (a.prediction.risk.riskPercentage || 0))
      .slice(0, 3);

    if (ranked.length === 0) return 'No shared model predictions are available yet.';
    return ranked
      .map(({ patient, prediction }) => `${patient.name} (${patient.patient_id}) is ${prediction.risk.label} at ${prediction.risk.riskPercentage}% risk.`)
      .join(' ');
  }

  if (normalized.includes('why') || normalized.includes('factor')) {
    const patientId = extractPatientIdFromQuery(query, patients);
    if (!patientId || !predictions?.[patientId]) return null;
    const prediction = predictions[patientId];
    const factors = prediction.factors?.slice(0, 3) || [];
    return `${patients.find((patient) => patient.patient_id === patientId)?.name || patientId} is flagged because ${factors.join(' ') || 'the model did not return factor detail.'}`;
  }

  if (normalized.includes('changed') || normalized.includes('last 6 hours') || normalized.includes('trend')) {
    const patientId = extractPatientIdFromQuery(query, patients);
    if (!patientId || !history?.[patientId]?.length) return null;
    const patient = patients.find((item) => item.patient_id === patientId);
    return formatPredictionLine(patient, predictions?.[patientId], history[patientId]);
  }

  if (normalized.includes('recommend')) {
    const patientId = extractPatientIdFromQuery(query, patients);
    if (!patientId || !predictions?.[patientId]) return null;
    const actions = predictions[patientId].recommendations?.slice(0, 3) || [];
    return actions.length > 0
      ? `Recommended actions for ${patients.find((patient) => patient.patient_id === patientId)?.name || patientId}: ${actions.join(' ')}`
      : `No model recommendations are available yet for ${patientId}.`;
  }

  if (normalized.includes('alert')) {
    if (!alerts?.length) return 'No model-driven clinical-intelligence alerts are currently active.';
    return alerts
      .slice(0, 3)
      .map((alert) => `${alert.name} in ${alert.bed_id}: ${alert.category} with score ${alert.risk_score}.`)
      .join(' ');
  }

  return null;
};
