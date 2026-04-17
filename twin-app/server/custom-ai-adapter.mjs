import http from 'node:http';

const HOST = process.env.CUSTOM_AI_HOST || '127.0.0.1';
const PORT = Number(process.env.CUSTOM_AI_PORT || 8787);

const json = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const round = (value, digits = 1) => {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
};

const riskLabel = (prob7d) => {
  if (prob7d >= 0.75) return 'Critical';
  if (prob7d >= 0.5) return 'High';
  if (prob7d >= 0.25) return 'Moderate';
  return 'Low';
};

const buildFactors = ({ age, hr, map, spo2, respiratoryRate, glucose, creatinine, wbc, lactate, shockIndex }) => {
  const factors = [];
  if (age >= 75) factors.push('Advanced age (75+) increases mortality risk.');
  else if (age >= 60) factors.push('Older adult age band contributes to elevated baseline risk.');
  if (map < 65) factors.push('Mean arterial pressure below 65 suggests hemodynamic instability.');
  if (lactate > 4) factors.push('Lactate above 4 mmol/L indicates severe tissue hypoperfusion.');
  else if (lactate > 2) factors.push('Elevated lactate indicates ongoing metabolic stress.');
  if (spo2 < 90) factors.push('Low oxygen saturation suggests respiratory compromise.');
  if (respiratoryRate < 8 || respiratoryRate > 35) factors.push('Respiratory rate is outside safe physiologic range.');
  if (shockIndex > 1.5) factors.push('Shock index above 1.5 is strongly associated with deterioration.');
  else if (shockIndex > 1.0) factors.push('Elevated shock index suggests reduced circulatory reserve.');
  if (creatinine > 2) factors.push('Creatinine above 2.0 indicates significant renal dysfunction.');
  else if (creatinine > 1.2) factors.push('Renal function is impaired and contributes to risk.');
  if (wbc < 4 || wbc > 15) factors.push('White blood cell count is outside the normal range.');
  if (glucose > 200 || glucose < 60) factors.push('Glucose is in a high-risk range for critically ill patients.');
  if (hr < 40 || hr > 140) factors.push('Heart rate is in a critical range.');
  return factors;
};

const buildRecommendations = ({ riskLevel, map, spo2, respiratoryRate, glucose, creatinine, lactate }) => {
  const actions = [];
  if (map < 65) actions.push('Escalate hemodynamic assessment and review fluid or vasopressor support.');
  if (spo2 < 90) actions.push('Reassess oxygen delivery and respiratory support immediately.');
  if (respiratoryRate > 24) actions.push('Increase respiratory monitoring and consider ventilatory review.');
  if (lactate > 2) actions.push('Trend lactate closely and evaluate for worsening perfusion or sepsis.');
  if (creatinine > 1.5) actions.push('Review renal function, nephrotoxic exposures, and fluid balance.');
  if (glucose > 200 || glucose < 60) actions.push('Correct glucose abnormalities per ICU protocol.');
  if (actions.length === 0) {
    actions.push('Continue close ICU monitoring and trend vital signs with repeat model inference.');
  }
  if (riskLevel === 'Critical' || riskLevel === 'High') {
    actions.unshift('Escalate to the attending ICU team for immediate review.');
  }
  return actions;
};

const buildAlerts = ({ hr, map, spo2, respiratoryRate, creatinine, lactate }) => {
  const alerts = [];
  if (hr > 120) alerts.push('Tachycardia (HR > 120 bpm)');
  if (map < 65) alerts.push('Hypotension (MAP < 65 mmHg)');
  if (lactate > 4) alerts.push('High lactate (> 4 mmol/L)');
  if (spo2 < 90) alerts.push('Hypoxemia (SpO2 < 90%)');
  if (respiratoryRate > 35) alerts.push('Severe tachypnea (RR > 35/min)');
  if (creatinine > 1.5) alerts.push('Renal dysfunction (Creatinine > 1.5 mg/dL)');
  return alerts;
};

const buildFeatureAttributions = ({ age, hr, map, spo2, respiratoryRate, glucose, creatinine, wbc, lactate, shockIndex }) => {
  const attribution = [];

  const push = (feature, label, impact, direction = 'positive') => {
    attribution.push({
      feature,
      label,
      impact: round(impact, 2),
      direction,
    });
  };

  if (lactate > 2) push('lactate', `Lactate ${round(lactate, 1)} mmol/L is elevating mortality risk.`, Math.min(lactate * 6, 26));
  if (map < 65) push('map', `MAP ${round(map, 1)} mmHg indicates hemodynamic compromise.`, Math.max((65 - map) * 0.8, 8));
  if (shockIndex > 1) push('shock_index', `Shock index ${round(shockIndex, 2)} suggests circulatory strain.`, Math.min(shockIndex * 10, 18));
  if (creatinine > 1.2) push('creatinine', `Creatinine ${round(creatinine, 1)} mg/dL adds renal-risk burden.`, Math.min(creatinine * 4, 16));
  if (spo2 < 93) push('spo2', `SpO2 ${round(spo2, 1)}% reflects respiratory instability.`, Math.max((95 - spo2) * 1.6, 6));
  if (wbc < 4 || wbc > 15) push('wbc', `WBC ${round(wbc, 1)} is outside the normal range.`, Math.min(Math.abs(wbc - 10) * 1.2, 12));
  if (glucose > 180 || glucose < 70) push('glucose', `Glucose ${round(glucose, 1)} mg/dL is outside the preferred ICU range.`, Math.min(Math.abs(glucose - 120) / 8, 10));
  if (respiratoryRate > 24) push('respiratory_rate', `Respiratory rate ${round(respiratoryRate, 1)}/min indicates increased work of breathing.`, Math.min((respiratoryRate - 20) * 1.1, 12));
  if (age >= 60) push('age', `Age ${round(age, 0)} contributes to baseline ICU mortality risk.`, Math.min((age - 50) * 0.25, 10));
  if (hr > 110) push('heart_rate', `Heart rate ${round(hr, 1)} bpm suggests physiologic stress.`, Math.min((hr - 90) * 0.35, 10));

  return attribution
    .sort((a, b) => (b.impact || 0) - (a.impact || 0))
    .slice(0, 6);
};

const predict = (payload) => {
  const featureVector = payload?.feature_vector || {};
  const vitals = payload?.vitals || {};
  const labs = payload?.labs || {};
  const patient = payload?.patient || {};

  const age = toNumber(featureVector.Age ?? patient.age);
  const hr = toNumber(featureVector.HR ?? vitals.heart_rate);
  const sysBp = toNumber(featureVector.SysBP ?? vitals.systolic_bp);
  const diasBp = toNumber(featureVector.DiasBP ?? vitals.diastolic_bp);
  const map = toNumber(featureVector.MAP ?? vitals.map ?? (sysBp !== null && diasBp !== null ? (sysBp + (2 * diasBp)) / 3 : null));
  const respiratoryRate = toNumber(featureVector.RespRate ?? vitals.respiratory_rate);
  const temp = toNumber(featureVector.Temp ?? vitals.temperature_celsius);
  const spo2 = toNumber(featureVector.SpO2 ?? vitals.spo2);
  const glucose = toNumber(featureVector.Glucose ?? labs.glucose);
  const creatinine = toNumber(featureVector.Creatinine ?? labs.creatinine);
  const wbc = toNumber(featureVector.WBC ?? labs.wbc);
  const lactate = toNumber(featureVector.Lactate ?? labs.lactate);

  const required = { age, hr, sysBp, diasBp, map, respiratoryRate, temp, spo2, glucose, creatinine, wbc, lactate };
  const missing = Object.entries(required)
    .filter(([, value]) => value === null)
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const shockIndex = hr / sysBp;
  let riskScore = 0;

  if (age < 40) riskScore += 0;
  else if (age < 60) riskScore += 5;
  else if (age < 75) riskScore += 10;
  else riskScore += 20;

  if (hr < 40 || hr > 140) riskScore += 5;
  if (map < 65) riskScore += 10;
  if (spo2 < 90) riskScore += 5;
  if (respiratoryRate < 8 || respiratoryRate > 35) riskScore += 5;

  if (lactate > 4) riskScore += 15;
  else if (lactate > 2) riskScore += 8;
  else if (lactate > 1.5) riskScore += 3;

  if (creatinine > 2) riskScore += 10;
  else if (creatinine > 1.5) riskScore += 5;
  else if (creatinine > 1.2) riskScore += 2;

  if (wbc < 4 || wbc > 15) riskScore += 5;
  if (glucose > 200 || glucose < 60) riskScore += 5;

  if (shockIndex > 1.5) riskScore += 10;
  else if (shockIndex > 1.0) riskScore += 5;
  else if (shockIndex > 0.8) riskScore += 2;

  const normalizedRisk = Math.min(riskScore / 100, 1);
  let deathProb7d;

  if (normalizedRisk < 0.1) deathProb7d = normalizedRisk * 0.15;
  else if (normalizedRisk < 0.2) deathProb7d = 0.015 + (normalizedRisk - 0.1) * 0.35;
  else if (normalizedRisk < 0.3) deathProb7d = 0.05 + (normalizedRisk - 0.2) * 0.5;
  else if (normalizedRisk < 0.4) deathProb7d = 0.1 + (normalizedRisk - 0.3) * 0.8;
  else if (normalizedRisk < 0.5) deathProb7d = 0.18 + (normalizedRisk - 0.4) * 1.2;
  else if (normalizedRisk < 0.6) deathProb7d = 0.3 + (normalizedRisk - 0.5) * 1.5;
  else if (normalizedRisk < 0.7) deathProb7d = 0.45 + (normalizedRisk - 0.6) * 2;
  else if (normalizedRisk < 0.8) deathProb7d = 0.65 + (normalizedRisk - 0.7) * 2.5;
  else deathProb7d = 0.9 + (normalizedRisk - 0.8) * 0.5;

  deathProb7d = clamp(deathProb7d, 0.005, 0.95);
  const deathProb30d = clamp(deathProb7d * 1.4, 0.01, 0.98);
  const survival7d = 1 - deathProb7d;
  const survival30d = 1 - deathProb30d;
  const medianSurvivalDays =
    deathProb7d < 0.05 ? 30 :
    deathProb7d < 0.15 ? 25 :
    deathProb7d < 0.3 ? 20 :
    deathProb7d < 0.5 ? 15 :
    deathProb7d < 0.7 ? 7 : 3;

  const riskLevel = riskLabel(deathProb7d);
  const factors = buildFactors({ age, hr, map, spo2, respiratoryRate, glucose, creatinine, wbc, lactate, shockIndex });
  const recommendations = buildRecommendations({ riskLevel, map, spo2, respiratoryRate, glucose, creatinine, lactate });
  const alerts = buildAlerts({ hr, map, spo2, respiratoryRate, creatinine, lactate });
  const featureAttribution = buildFeatureAttributions({ age, hr, map, spo2, respiratoryRate, glucose, creatinine, wbc, lactate, shockIndex });
  const confidence = clamp(0.72 + Math.min(factors.length, 5) * 0.04, 0.72, 0.94);
  const uncertaintyBand = clamp(0.05 + Math.min(riskScore, 80) / 400, 0.05, 0.18);
  const riskLower = clamp(deathProb7d - uncertaintyBand, 0.005, 0.95);
  const riskUpper = clamp(deathProb7d + uncertaintyBand, 0.005, 0.98);
  const timeToEventDays = round(Math.max(1, medianSurvivalDays * (1 - deathProb7d * 0.35)), 1);
  const cohortRelativeRisk = round(1 + (deathProb7d - 0.18) * 3.5, 2);
  const cohortPercentile = clamp(0.45 + deathProb7d * 0.5, 0.05, 0.99);

  return {
    risk_assessment: {
      death_prob_7d: round(deathProb7d, 4),
      death_prob_30d: round(deathProb30d, 4),
      survival_7d: round(survival7d, 4),
      survival_30d: round(survival30d, 4),
      median_survival_days: medianSurvivalDays,
      risk_score: round(riskScore, 1),
      overall_score: round(riskScore, 1),
      risk_level: riskLevel,
      category: riskLevel.toUpperCase(),
      risk_percentage: round(deathProb7d * 100, 1),
      confidence: round(confidence, 4),
    },
    classification_label: `${riskLevel} Mortality Risk`,
    confidence: round(confidence, 4),
    contributing_factors: factors,
    recommended_actions: recommendations,
    clinical_alerts: alerts,
    uncertainty: {
      risk_lower: round(riskLower, 4),
      risk_upper: round(riskUpper, 4),
      label: 'Heuristic uncertainty band based on current feature completeness and acuity.',
    },
    feature_attribution: featureAttribution,
    time_to_event_estimate: {
      expected_days: timeToEventDays,
      label: riskLevel === 'Critical' ? 'Short-term deterioration window' : 'Estimated time-to-event window',
    },
    cohort_comparison: {
      cohort: 'ICU mortality reference cohort',
      relative_risk: cohortRelativeRisk,
      percentile: round(cohortPercentile, 4),
    },
    survival_curve: {
      time_points: [1, 7, 14, 30, 60, 90],
      survival_probabilities: [
        round(Math.max(0.05, 1 - deathProb7d * 0.35), 4),
        round(survival7d, 4),
        round(Math.max(0.05, survival7d - 0.05), 4),
        round(survival30d, 4),
        round(Math.max(0.05, survival30d - 0.03), 4),
        round(Math.max(0.05, survival30d - 0.06), 4),
      ],
    },
    model_info: {
      model: 'NEOcare ICU Mortality Prediction Adapter',
      model_type: 'Clinical Rule-Based Adapter',
      source_model: payload?.model_name || 'NEOcare Mortality Prediction',
      served_by: `http://${HOST}:${PORT}`,
    },
    input_summary: {
      patient_id: patient.patient_id || null,
      bed_id: payload?.icu?.bed_id || null,
      map: round(map, 1),
      shock_index: round(shockIndex, 2),
    },
  };
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { status: 'ok', model: 'NEOcare ICU Mortality Prediction Adapter' });
  }

  if (req.method === 'POST' && req.url === '/icu/ai/models/custom/predict') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        return json(res, 200, predict(payload));
      } catch (error) {
        const status = error.status || 500;
        return json(res, status, {
          detail: status === 500 ? 'Model adapter failed to process the request.' : error.message,
        });
      }
    });
    return;
  }

  return json(res, 404, { detail: 'Not Found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Custom AI adapter listening on http://${HOST}:${PORT}`);
});
