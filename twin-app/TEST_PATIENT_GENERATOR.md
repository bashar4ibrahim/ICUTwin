# 🧪 Test Patient Generator - Feature Documentation

## Overview
The Test Patient Generator is a development feature that allows you to quickly generate realistic ICU patient records with synthetic vital signs data for testing the AI risk engine and system functionality.

## Features

### ✨ Key Capabilities

1. **One-Click Patient Generation**
   - Generates a complete patient record with realistic data
   - Includes patient demographics, diagnosis, and initial vital signs
   - Automatically calculates patient status (Stable/Warning/Critical)

2. **Realistic Vital Signs**
   - Different diagnosis profiles with appropriate vital sign ranges
   - Heart Rate, SpO₂, Blood Pressure, Respiratory Rate, Temperature
   - Lab values: Glucose, Creatinine, WBC, Lactate, Platelet Count

3. **Auto-Update Every 2 Minutes**
   - Vitals automatically update to simulate real-world scenarios
   - Random trend variations:
     - **85% Stable** - Vitals maintain baseline
     - **15% Improving** - Gradual improvement
     - **10% Deteriorating** - Gradual decline
     - **5% Critical Change** - Sudden large changes

4. **AI Risk Engine Testing**
   - Generated patients have complete data needed for predictions
   - Updates trigger automatic AI risk prediction re-evaluation
   - Perfect for testing threshold detection and escalation logic

## Supported Diagnosis Profiles

The generator includes realistic profiles for:

### 🩺 Sepsis
- High fever (37.5-39.5°C), tachycardia (100-140 bpm)
- Elevated lactate and WBC
- Risk Level: **High**

### 🫁 Acute Respiratory Distress (ARDS)
- Low oxygen saturation (85-94%)
- Tachypnea (22-35 /min)
- Risk Level: **High**

### ❤️ Acute Heart Failure
- Elevated BP (105-160 mmHg systolic)
- Tachycardia and elevated creatinine
- Risk Level: **Medium**

### 🏥 Post-Operative Recovery
- Mild elevation in heart rate and temperature
- Elevated glucose and WBC (normal post-op response)
- Risk Level: **Low**

### ✅ Stable Patient
- Normal vitals across all parameters
- Routine monitoring parameters
- Risk Level: **Low**

## How to Use

### Generate a Test Patient

1. Go to **ICU Patients** page
2. Click **🧪 Add Test Patient** button (green button next to "Admit Patient")
3. A new patient will be generated and admitted
4. Status shows: `✓ Test Patient Active (ID: XXXXX) — Auto-updating every 2 min`

### What Happens Next

1. **Immediate Actions:**
   - Patient appears in the patient list
   - Initial vitals are recorded
   - AI risk prediction runs automatically
   - Patient timeline is created

2. **Every 2 Minutes:**
   - Vitals are automatically updated
   - New values reflect realistic variation
   - AI risk engine re-evaluates and updates predictions
   - Clinical intelligence is updated
   - Timeline records the changes

3. **To Stop:**
   - Discharge the test patient like any regular patient
   - Auto-update interval automatically stops

## Generated Data Structure

### Patient Object
```javascript
{
  patient_id: "TEST-{timestamp}-{random}",
  name: "Realistic random name",
  age: 45-85 years,
  gender: "M" or "F",
  diagnosis: "One of the profiles above",
  status: "stable|warning|critical",
  bed_id: "ICU-01 through ICU-08",
  admitted_at: "ISO timestamp",
  latest_vitals: {
    heart_rate: number (bpm),
    spo2: number (%),
    blood_pressure_sys: number (mmHg),
    blood_pressure_dia: number (mmHg),
    respiratory_rate: number (/min),
    temperature: number (°C),
    timestamp: ISO string
  },
  model_inputs: {
    age, heart_rate, systolic_bp, diastolic_bp,
    respiratory_rate, temperature, spo2,
    glucose, creatinine, wbc, lactate, platelet_count
  }
}
```

## Testing Scenarios

### Test AI Risk Escalation
1. Generate test patient
2. Watch as vitals evolve
3. Observe how AI risk score changes
4. Verify escalation alerts trigger correctly

### Test Data Flow
1. Generate patient → Vitals → Predictions → Alerts
2. Verify all systems in the pipeline work correctly

### Test Real-Time Updates
1. Generate patient
2. Check timeline and prediction history
3. Verify 2-minute updates reflect in all screens
4. Check vitals charts update correctly

### Test Multiple Patients
1. Generate one test patient
2. Manually admit regular patients
3. Mix of test and real data helps verify system stability

## Technical Details

### Mock Data Generator (`mockDataGenerator.js`)
- **Functions:**
  - `generateMockPatient()` - Creates randomized patient data
  - `updateMockVitals(patient, trend)` - Updates vitals with trend
  - `generateMockPatientBatch(count)` - Batch generation

- **Vital Variation Algorithm:**
  - Uses normal distribution around baseline
  - Clips to min/max ranges for realism
  - Varies by trend parameter for controlled changes

### Auto-Update Mechanism
- 2-minute interval triggered automatically
- Random trend selection (weighted probabilities)
- Updates with `POST /icu/vitals/{patientId}`
- Triggers prediction re-evaluation
- Fetches updated patient list in UI

## Limitations & Notes

⚠️ **Important:**
- Only one test patient can be active at a time (UI design)
- Test patients are real data in the system
- Can be mixed with actual patient records
- Test patient IDs start with "TEST-" for identification
- Auto-update stops when patient is discharged
- For production: disable or modify feature per your requirements

## Example Usage Workflow

```
1. Click "🧪 Add Test Patient"
   ↓
2. Patient "TEST-xxx" is created
   ↓
3. Initial vitals recorded and AI model runs
   ↓
4. Wait 2 minutes...
   ↓
5. Vitals automatically update (e.g., HR goes from 115 → 118)
   ↓
6. AI model re-runs with new data
   ↓
7. Risk score may change based on trend
   ↓
8. Repeat every 2 minutes until patient is discharged
```

## Troubleshooting

### Button doesn't appear
- Check network connection to API
- Verify authentication token is valid
- Check browser console for errors

### Auto-updates not happening
- Patient may have been discharged
- Check browser console for errors
- Verify backend is receiving vitals POST requests

### Wrong patient data
- Diagnosis profiles are randomly selected
- No way to choose specific profile currently
- Generate new test patient if profile not needed

## Future Enhancements

Potential improvements:
- [ ] Allow choosing diagnosis profile
- [ ] Manual control over trend direction
- [ ] Batch generate multiple test patients
- [ ] Preset scenarios (sepsis progression, cardiac event, etc.)
- [ ] Export test data to CSV
- [ ] Replay recorded real patient data
- [ ] API endpoint to generate from backend

---

**Version:** 1.0  
**Created:** April 2026  
**Status:** Development Feature ✓ Ready for Testing
