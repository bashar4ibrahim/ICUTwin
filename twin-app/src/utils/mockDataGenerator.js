/**
 * Mock Patient Data Generator
 * Generates realistic patient data with vital signs for testing
 * Simulates real-world scenarios with gradual changes
 */

// Common diagnoses with typical vital sign ranges and lab values
const DIAGNOSIS_PROFILES = {
  sepsis: {
    diagnosis: 'Sepsis (Suspected)',
    vitalRanges: {
      heart_rate: { min: 100, max: 140, base: 115 },
      spo2: { min: 88, max: 96, base: 92 },
      blood_pressure_sys: { min: 95, max: 130, base: 110 },
      blood_pressure_dia: { min: 55, max: 80, base: 68 },
      respiratory_rate: { min: 18, max: 30, base: 24 },
      temperature: { min: 37.5, max: 39.5, base: 38.8 },
    },
    labValues: {
      glucose: { min: 140, max: 280, base: 200 },
      creatinine: { min: 1.5, max: 3.5, base: 2.2 },
      wbc: { min: 12, max: 25, base: 18.5 },
      lactate: { min: 2.5, max: 6.0, base: 4.2 },
      platelet_count: { min: 80, max: 150, base: 110 },
    },
    risk: 'high',
  },
  respiratory_distress: {
    diagnosis: 'Acute Respiratory Distress Syndrome (ARDS)',
    vitalRanges: {
      heart_rate: { min: 95, max: 130, base: 110 },
      spo2: { min: 85, max: 94, base: 89 },
      blood_pressure_sys: { min: 100, max: 140, base: 120 },
      blood_pressure_dia: { min: 60, max: 85, base: 72 },
      respiratory_rate: { min: 22, max: 35, base: 28 },
      temperature: { min: 36.8, max: 38.5, base: 37.8 },
    },
    labValues: {
      glucose: { min: 110, max: 200, base: 150 },
      creatinine: { min: 1.2, max: 2.8, base: 1.8 },
      wbc: { min: 10, max: 20, base: 14.5 },
      lactate: { min: 1.5, max: 4.0, base: 2.5 },
      platelet_count: { min: 100, max: 200, base: 150 },
    },
    risk: 'high',
  },
  cardiac_failure: {
    diagnosis: 'Acute Heart Failure',
    vitalRanges: {
      heart_rate: { min: 90, max: 125, base: 105 },
      spo2: { min: 90, max: 97, base: 94 },
      blood_pressure_sys: { min: 105, max: 160, base: 135 },
      blood_pressure_dia: { min: 65, max: 95, base: 80 },
      respiratory_rate: { min: 16, max: 28, base: 22 },
      temperature: { min: 36.5, max: 37.8, base: 37.2 },
    },
    labValues: {
      glucose: { min: 100, max: 180, base: 130 },
      creatinine: { min: 1.8, max: 3.0, base: 2.2 },
      wbc: { min: 8, max: 16, base: 11 },
      lactate: { min: 1.0, max: 3.0, base: 1.8 },
      platelet_count: { min: 120, max: 220, base: 170 },
    },
    risk: 'medium',
  },
  post_surgery: {
    diagnosis: 'Post-Operative Recovery (General Surgery)',
    vitalRanges: {
      heart_rate: { min: 70, max: 105, base: 85 },
      spo2: { min: 95, max: 99, base: 97 },
      blood_pressure_sys: { min: 110, max: 145, base: 125 },
      blood_pressure_dia: { min: 65, max: 85, base: 75 },
      respiratory_rate: { min: 14, max: 22, base: 18 },
      temperature: { min: 36.8, max: 38.2, base: 37.5 },
    },
    labValues: {
      glucose: { min: 110, max: 200, base: 140 },
      creatinine: { min: 0.8, max: 1.5, base: 1.0 },
      wbc: { min: 10, max: 18, base: 13 },
      lactate: { min: 1.5, max: 2.5, base: 1.8 },
      platelet_count: { min: 150, max: 250, base: 200 },
    },
    risk: 'low',
  },
  stable: {
    diagnosis: 'Stable Patient - Routine Monitoring',
    vitalRanges: {
      heart_rate: { min: 60, max: 90, base: 75 },
      spo2: { min: 96, max: 100, base: 98 },
      blood_pressure_sys: { min: 115, max: 135, base: 125 },
      blood_pressure_dia: { min: 70, max: 85, base: 78 },
      respiratory_rate: { min: 12, max: 20, base: 16 },
      temperature: { min: 36.5, max: 37.3, base: 37.0 },
    },
    labValues: {
      glucose: { min: 80, max: 120, base: 100 },
      creatinine: { min: 0.6, max: 1.2, base: 0.9 },
      wbc: { min: 4, max: 11, base: 7 },
      lactate: { min: 0.5, max: 1.5, base: 1.0 },
      platelet_count: { min: 150, max: 300, base: 220 },
    },
    risk: 'low',
  },
};

// First names for generated patients
const FIRST_NAMES = ['John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];

const BED_IDS = ['ICU-01', 'ICU-02', 'ICU-03', 'ICU-04', 'ICU-05', 'ICU-06', 'ICU-07', 'ICU-08'];

function resolveDiagnosisProfile(diagnosis = '') {
  const normalizedDiagnosis = String(diagnosis).toLowerCase();

  if (normalizedDiagnosis.includes('sepsis') || normalizedDiagnosis.includes('septic')) {
    return DIAGNOSIS_PROFILES.sepsis;
  }
  if (
    normalizedDiagnosis.includes('resp') ||
    normalizedDiagnosis.includes('ards') ||
    normalizedDiagnosis.includes('pneum') ||
    normalizedDiagnosis.includes('oxygen')
  ) {
    return DIAGNOSIS_PROFILES.respiratory_distress;
  }
  if (
    normalizedDiagnosis.includes('heart') ||
    normalizedDiagnosis.includes('card') ||
    normalizedDiagnosis.includes('failure')
  ) {
    return DIAGNOSIS_PROFILES.cardiac_failure;
  }
  if (
    normalizedDiagnosis.includes('post') ||
    normalizedDiagnosis.includes('surgery') ||
    normalizedDiagnosis.includes('operative')
  ) {
    return DIAGNOSIS_PROFILES.post_surgery;
  }

  return DIAGNOSIS_PROFILES.stable;
}

function determineStatusFromVitals(vitals = {}) {
  if (vitals.spo2 < 90 || vitals.heart_rate > 120 || vitals.temperature > 39) {
    return 'critical';
  }
  if (vitals.spo2 < 94 || vitals.heart_rate > 110 || vitals.temperature > 38.5) {
    return 'warning';
  }
  return 'stable';
}

function buildModelInputs({ age, vitals, labValues }) {
  return {
    age,
    heart_rate: vitals.heart_rate,
    systolic_bp: vitals.blood_pressure_sys,
    diastolic_bp: vitals.blood_pressure_dia,
    map: Math.round(((vitals.blood_pressure_sys + (2 * vitals.blood_pressure_dia)) / 3) * 10) / 10,
    respiratory_rate: vitals.respiratory_rate,
    temperature_celsius: vitals.temperature,
    spo2: vitals.spo2,
    glucose: labValues.glucose,
    creatinine: labValues.creatinine,
    wbc: labValues.wbc,
    lactate: labValues.lactate,
  };
}

/**
 * Generate a random value within a range with natural variation
 */
function getVariableVital(base, min, max) {
  // Add small random variation (±5% with normal distribution)
  const variation = (Math.random() - 0.5) * (base * 0.1);
  const value = base + variation;
  return Math.round(Math.max(min, Math.min(max, value)) * 10) / 10;
}

/**
 * Generate realistic vital signs for a patient
 */
function generateVitals(profile, variation = 0) {
  const ranges = profile.vitalRanges;
  return {
    heart_rate: getVariableVital(ranges.heart_rate.base + variation, ranges.heart_rate.min, ranges.heart_rate.max),
    spo2: getVariableVital(ranges.spo2.base + (variation * 0.3), ranges.spo2.min, ranges.spo2.max),
    blood_pressure_sys: getVariableVital(ranges.blood_pressure_sys.base + variation, ranges.blood_pressure_sys.min, ranges.blood_pressure_sys.max),
    blood_pressure_dia: getVariableVital(ranges.blood_pressure_dia.base + (variation * 0.5), ranges.blood_pressure_dia.min, ranges.blood_pressure_dia.max),
    respiratory_rate: getVariableVital(ranges.respiratory_rate.base + (variation * 0.5), ranges.respiratory_rate.min, ranges.respiratory_rate.max),
    temperature: getVariableVital(ranges.temperature.base + (variation * 0.1), ranges.temperature.min, ranges.temperature.max),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate lab values for a patient
 */
function generateLabValues(profile) {
  const labs = profile.labValues;
  return {
    glucose: getVariableVital(labs.glucose.base, labs.glucose.min, labs.glucose.max),
    creatinine: Math.round(getVariableVital(labs.creatinine.base, labs.creatinine.min, labs.creatinine.max) * 100) / 100,
    wbc: Math.round(getVariableVital(labs.wbc.base, labs.wbc.min, labs.wbc.max) * 10) / 10,
    lactate: Math.round(getVariableVital(labs.lactate.base, labs.lactate.min, labs.lactate.max) * 100) / 100,
    platelet_count: getVariableVital(labs.platelet_count.base, labs.platelet_count.min, labs.platelet_count.max),
  };
}

export function generateAdmissionSeedData(patient = {}, overrides = {}) {
  const profile = resolveDiagnosisProfile(patient.diagnosis);
  const vitals = {
    ...generateVitals(profile, overrides.variation || 0),
    ...(overrides.vitals || {}),
    timestamp: overrides.vitals?.timestamp || new Date().toISOString(),
  };
  const labValues = {
    ...generateLabValues(profile),
    ...(overrides.labs || {}),
  };
  const age = Number(patient.age) || Number(overrides.age) || '';

  return {
    vitals,
    labValues,
    modelInputs: buildModelInputs({ age, vitals, labValues }),
    status: overrides.status || determineStatusFromVitals(vitals),
  };
}

/**
 * Generate a complete patient object with realistic data
 */
export function generateMockPatient() {
  const profileKeys = Object.keys(DIAGNOSIS_PROFILES);
  const selectedProfile = DIAGNOSIS_PROFILES[profileKeys[Math.floor(Math.random() * profileKeys.length)]];
  
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const age = Math.floor(Math.random() * 40) + 45; // 45-85 years old
  const gender = Math.random() > 0.5 ? 'M' : 'F';
  const bedId = BED_IDS[Math.floor(Math.random() * BED_IDS.length)];
  
  // Generate initial vitals with some variation
  const vitals = generateVitals(selectedProfile, 0);
  const labValues = generateLabValues(selectedProfile);
  const status = determineStatusFromVitals(vitals);

  const patient = {
    patient_id: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    name: `${firstName} ${lastName}`,
    age,
    gender,
    diagnosis: selectedProfile.diagnosis,
    status,
    bed_id: bedId,
    admitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toISOString(), // 0-7 days ago
    latest_vitals: vitals,
    model_inputs: buildModelInputs({ age, vitals, labValues }),
  };

  return patient;
}

/**
 * Generate updated vitals for an existing patient (simulates real-world changes)
 * Can trend toward improvement or deterioration
 */
export function updateMockVitals(patient, trend = 'stable') {
  const profile = resolveDiagnosisProfile(patient?.diagnosis);

  // Apply trend: positive for improvement, negative for deterioration, 0 for stable
  let variation = 0;
  if (trend === 'improving') variation = -3; // Slightly better
  else if (trend === 'deteriorating') variation = 3; // Slightly worse
  else if (trend === 'critical_change') variation = Math.random() > 0.5 ? 8 : -5; // Big change

  const newVitals = generateVitals(profile, variation);
  const newLabValues = generateLabValues(profile);
  const newStatus = determineStatusFromVitals(newVitals);

  return {
    ...patient,
    latest_vitals: newVitals,
    status: newStatus,
    model_inputs: {
      ...(patient.model_inputs || {}),
      ...buildModelInputs({
        age: patient.age,
        vitals: newVitals,
        labValues: newLabValues,
      }),
    },
  };
}

/**
 * Generate a batch of test patients for dashboard view
 */
export function generateMockPatientBatch(count = 5) {
  return Array.from({ length: count }, generateMockPatient);
}

export default {
  generateMockPatient,
  generateAdmissionSeedData,
  updateMockVitals,
  generateMockPatientBatch,
  DIAGNOSIS_PROFILES,
};
