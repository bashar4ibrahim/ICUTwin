import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Patients.css';
import {
  apiFetch,
  formatPercent,
  formatTrendText,
  getRiskTone,
  RISK_COLOR,
  AVT_COLORS,
  summarizeTrend,
  normalizeVitalsPayload,
} from '../../app/shared';
import { useClinicalIntelligence } from '../ClinicalIntelligenceProvider/ClinicalIntelligenceProvider';
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../EmptyState/EmptyState';
import ErrorBanner from '../ErrorBanner/ErrorBanner';
import PatientDetail from './PatientDetail';
import GenerateReportButton from './GenerateReportButton';
import PatientReportModal from './PatientReportModal';
import {
  generateAdmissionSeedData,
  generateMockPatient,
  updateMockVitals,
} from '../../utils/mockDataGenerator';
import {
  fetchPatientVitalsFromAPI,
  subscribeToPatientStream,
  unsubscribeFromPatientStream,
  normalizeStreamingResponse,
} from '../../utils/patientStreamingAPI';

const DEFAULT_ADMIT_FORM = {
  name: '',
  age: '',
  gender: 'Male',
  diagnosis: '',
  bed_id: 'ICU-03',
};

const extractPatientRecord = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.patient && typeof payload.patient === 'object') return payload.patient;
  if (payload.data && typeof payload.data === 'object') return payload.data;
  return payload.patient_id ? payload : null;
};

const resolveCreatedPatientRecord = (createResponse, patients = [], form = {}) => {
  const createdRecord = extractPatientRecord(createResponse);
  if (createdRecord?.patient_id) {
    return (
      patients.find((patient) => patient.patient_id === createdRecord.patient_id) || createdRecord
    );
  }

  const normalizedName = String(form.name || '').trim().toLowerCase();
  const normalizedBed = String(form.bed_id || '').trim().toLowerCase();
  const reversedPatients = [...patients].reverse();

  return (
    reversedPatients.find(
      (patient) =>
        String(patient.name || '').trim().toLowerCase() === normalizedName &&
        String(patient.bed_id || '').trim().toLowerCase() === normalizedBed
    ) ||
    reversedPatients.find(
      (patient) => String(patient.name || '').trim().toLowerCase() === normalizedName
    ) ||
    reversedPatients[0] ||
    null
  );
};

const resolvePatientRiskScore = (patient, predictions = {}) => {
  const predictionRisk = Number(predictions[patient?.patient_id]?.risk?.riskPercentage);
  if (Number.isFinite(predictionRisk)) return predictionRisk;
  if (patient?.status === 'critical') return 72;
  if (patient?.status === 'stable') return 24;
  return 45;
};

const SnapshotCard = ({ label, value, note, tone = 'sky' }) => (
  <div className={`patients-snapshot-card tone-${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </div>
);

const FocusPatientCard = ({ patient, predictions, onOpen }) => {
  const riskScore = Math.round(resolvePatientRiskScore(patient, predictions));
  const prediction = predictions[patient.patient_id];
  const riskTone = getRiskTone(riskScore);

  return (
    <button
      type="button"
      className={`focus-patient-card tone-${riskTone}`}
      onClick={() => onOpen(patient.patient_id)}
    >
      <div className="focus-patient-card-top">
        <span className={`focus-patient-status tone-${riskTone}`}>
          {prediction?.risk?.label || patient.status || 'Observed'}
        </span>
        <strong>{riskScore}%</strong>
      </div>
      <div className="focus-patient-name">{patient.name}</div>
      <div className="focus-patient-meta">
        <span>{patient.bed_id || 'Unassigned bed'}</span>
        <span>{patient.diagnosis || 'Diagnosis pending'}</span>
      </div>
      <div className="focus-patient-bar">
        <div
          className="focus-patient-bar-fill"
          style={{
            width: `${Math.max(10, riskScore)}%`,
            background: `linear-gradient(90deg, ${RISK_COLOR(riskScore)}, ${RISK_COLOR(Math.max(riskScore - 12, 0))})`,
          }}
        />
      </div>
    </button>
  );
};

function Patients({ onSelectPatient }) {
  const {
    registerPatients,
    registerVitals,
    predictions,
    history: predictionHistory,
    alerts: modelAlerts,
    pending,
    errors: predictionErrors,
    runPredictionForPatient,
  } = useClinicalIntelligence();

  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdmit, setShowAdmit] = useState(false);
  const [showDischarge, setShowDischarge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Report state
  const [reportTarget, setReportTarget] = useState(null); // { patient, prediction, vitalsHistory }

  const [admitForm, setAdmitForm] = useState(DEFAULT_ADMIT_FORM);

  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [testPatientId, setTestPatientId] = useState(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  
  // Track active streaming intervals for cleanup
  const streamingIntervalsRef = useRef({});
  const pollingIntervalRef = useRef(null);

  const syncPatients = useCallback((nextPatients, source = 'patients') => {
    setPatients(nextPatients);
    registerPatients(nextPatients, source);
  }, [registerPatients]);

  const fetchPatients = useCallback(async ({ showLoading = true, source = 'patients' } = {}) => {
    if (showLoading) setLoading(true);

    try {
      const payload = await apiFetch('/icu/patients');
      const nextPatients = payload.patients || [];
      
      // Fetch latest vitals for each patient
      const patientsWithVitals = await Promise.all(
        nextPatients.map(async (patient) => {
          try {
            const vitalsResponse = await apiFetch(`/icu/vitals/${patient.patient_id}/history?limit=1`);
            const vitalsHistory = vitalsResponse?.history || [];
            const latestVitals = vitalsHistory.length > 0 ? vitalsHistory[0] : null;
            return {
              ...patient,
              latest_vitals: latestVitals || patient.latest_vitals || {}
            };
          } catch (vitalsError) {
            console.warn(`Failed to fetch vitals for patient ${patient.patient_id}:`, vitalsError);
            return patient;
          }
        })
      );
      
      syncPatients(patientsWithVitals, source);
      return patientsWithVitals;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [syncPatients]);

  useEffect(() => {
    fetchPatients();

    // Set up polling interval to refresh patient list every 15 seconds
    const pollingInterval = setInterval(() => {
      fetchPatients({ showLoading: false, source: 'auto-poll' });
    }, 15000);

    pollingIntervalRef.current = pollingInterval;

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchPatients]);

  const seedPatientForPrediction = useCallback(async ({ patientRecord, seedData, source }) => {
    if (!patientRecord?.patient_id || !seedData?.vitals) return patientRecord;

    const vitalsPayload = normalizeVitalsPayload(seedData.vitals);
    const vitalsSnapshot = {
      ...vitalsPayload,
      timestamp: seedData.vitals.timestamp || new Date().toISOString(),
    };
    const modelInputs = {
      ...seedData.modelInputs,
      age: Number(seedData.modelInputs?.age || patientRecord.age) || '',
    };
    const enrichedPatient = {
      ...patientRecord,
      status: seedData.status || patientRecord.status || 'stable',
      latest_vitals: {
        ...(patientRecord.latest_vitals || {}),
        ...vitalsSnapshot,
      },
      model_inputs: {
        ...(patientRecord.model_inputs || {}),
        ...modelInputs,
      },
    };

    try {
      await apiFetch(`/icu/vitals/${patientRecord.patient_id}`, {
        method: 'POST',
        body: JSON.stringify(vitalsPayload),
      });
    } catch (persistError) {
      console.warn('Unable to persist admission vitals, using local snapshot for AI bootstrap.', persistError);
    }

    registerPatients([enrichedPatient], source);
    registerVitals(patientRecord.patient_id, vitalsSnapshot, source);
    setPatients((currentPatients) =>
      currentPatients.map((patient) =>
        patient.patient_id === enrichedPatient.patient_id
          ? { ...patient, ...enrichedPatient }
          : patient
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 150));
    await runPredictionForPatient(patientRecord.patient_id, 'manual');

    return enrichedPatient;
  }, [registerPatients, registerVitals, runPredictionForPatient]);

  const handleAdmit = async () => {
    if (!admitForm.name || !admitForm.age || !admitForm.diagnosis) {
      setError('Please provide patient name, age, and diagnosis so the AI model can initialize correctly.');
      return;
    }

    try {
      setError('');
      const createResponse = await apiFetch('/icu/patients', {
        method: 'POST',
        body: JSON.stringify({ ...admitForm, age: parseInt(admitForm.age, 10) }),
      });

      const nextPatients = await fetchPatients({ showLoading: false, source: 'admission-refresh' });
      const createdPatient = resolveCreatedPatientRecord(createResponse, nextPatients, admitForm);

      if (!createdPatient?.patient_id) {
        throw new Error('Patient was admitted, but the new patient record could not be prepared for AI scoring.');
      }

      const seedData = generateAdmissionSeedData({
        ...createdPatient,
        ...admitForm,
        age: parseInt(admitForm.age, 10),
      });

      await seedPatientForPrediction({
        patientRecord: {
          ...createdPatient,
          age: parseInt(admitForm.age, 10),
        },
        seedData,
        source: 'admission-seed',
      });

      setShowAdmit(false);
      setAdmitForm(DEFAULT_ADMIT_FORM);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDischarge = async patientId => {
    try {
      // Unsubscribe from streaming
      if (streamingIntervalsRef.current[patientId]) {
        unsubscribeFromPatientStream(streamingIntervalsRef.current[patientId]);
        delete streamingIntervalsRef.current[patientId];
      }

      await apiFetch(`/icu/patients/${patientId}`, { method: 'DELETE' });
      setShowDischarge(null);
      if (testPatientId === patientId) setTestPatientId(null);
      fetchPatients();
    } catch (e) {
      setError(e.message);
    }
  };

  // Generate test patient and start 20-second refresh interval from API
  const handleGenerateTestPatient = async () => {
    setIsGeneratingTest(true);
    try {
      setError('');
      
      // Generate initial mock patient structure for admission
      const mockPatient = generateMockPatient();
      
      // Admit the patient
      const createResponse = await apiFetch('/icu/patients', {
        method: 'POST',
        body: JSON.stringify({
          name: mockPatient.name,
          age: mockPatient.age,
          gender: mockPatient.gender,
          diagnosis: mockPatient.diagnosis,
          bed_id: mockPatient.bed_id,
        }),
      });

      const allPatients = await fetchPatients({ showLoading: false, source: 'test-patient-refresh' });
      const newPatient = resolveCreatedPatientRecord(createResponse, allPatients, mockPatient);
      
      if (!newPatient?.patient_id) {
        throw new Error('The test patient was created, but the new record could not be located for streaming initialization.');
      }

      // Fetch initial vitals from WebSocket API and seed the patient
      let initialVitals = null;
      try {
        const streamingData = await fetchPatientVitalsFromAPI(newPatient.patient_id);
        const normalized = normalizeStreamingResponse(streamingData);
        if (normalized?.latest_vitals) {
          initialVitals = normalized.latest_vitals;
        }
      } catch (streamErr) {
        console.warn('Could not fetch from streaming API, using mock data:', streamErr);
        initialVitals = mockPatient.latest_vitals;
      }

      // Seed patient for initial prediction
      await seedPatientForPrediction({
        patientRecord: {
          ...newPatient,
          age: mockPatient.age,
        },
        seedData: {
          vitals: initialVitals || mockPatient.latest_vitals,
          modelInputs: mockPatient.model_inputs,
          status: mockPatient.status,
        },
        source: 'test-patient-seed',
      });

      setTestPatientId(newPatient.patient_id);
      
      // Subscribe to 20-second refresh interval from API
      const intervalId = subscribeToPatientStream(
        newPatient.patient_id,
        // onUpdate callback
        async (streamingData) => {
          try {
            const normalized = normalizeStreamingResponse(streamingData);
            if (!normalized) return;

            const nextVitals = normalizeVitalsPayload(normalized.latest_vitals);
            
            // Persist to backend
            await apiFetch(`/icu/vitals/${newPatient.patient_id}`, {
              method: 'POST',
              body: JSON.stringify(nextVitals),
            });

            // Update context and local state
            registerPatients([{
              ...normalized,
              latest_vitals: nextVitals,
            }], 'test-patient-stream-update');
            registerVitals(newPatient.patient_id, nextVitals, 'test-patient-stream-update');
            
            setPatients((currentPatients) =>
              currentPatients.map((patient) =>
                patient.patient_id === newPatient.patient_id
                  ? {
                      ...patient,
                      latest_vitals: nextVitals,
                      status: normalized.status,
                    }
                  : patient
              )
            );
            
            // Trigger prediction
            await new Promise((resolve) => setTimeout(resolve, 150));
            runPredictionForPatient(newPatient.patient_id, 'auto');
          } catch (updateErr) {
            console.warn('Stream update processing error:', updateErr);
          }
        },
        // onError callback
        (error) => {
          console.warn(`Stream error for patient ${newPatient.patient_id}:`, error);
        }
      );

      // Store interval for cleanup
      streamingIntervalsRef.current[newPatient.patient_id] = intervalId;
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      // Clean up polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Clean up all streaming intervals
      Object.values(streamingIntervalsRef.current).forEach(intervalId => {
        unsubscribeFromPatientStream(intervalId);
      });
      streamingIntervalsRef.current = {};
    };
  }, []);

  // Opens the report modal for a single patient
  const handleOpenReport = async (patient) => {
    const prediction = predictions[patient.patient_id];
    let vitalsHistory = [];
    try {
      const result = await apiFetch(`/icu/vitals/${patient.patient_id}/history`);
      vitalsHistory = result?.history || [];
    } catch (_) {
      // silently continue with empty history
    }
    setReportTarget({ patient, prediction, vitalsHistory });
  };

  const normalizedSearch = search.toLowerCase();
  const filtered = patients
    .filter(
      p =>
        (filter === 'all' || p.status === filter) &&
        (p.name?.toLowerCase().includes(normalizedSearch) ||
          p.diagnosis?.toLowerCase().includes(normalizedSearch) ||
          p.bed_id?.toLowerCase().includes(normalizedSearch))
    )
    .sort((left, right) => {
      const leftRisk = resolvePatientRiskScore(left, predictions);
      const rightRisk = resolvePatientRiskScore(right, predictions);
      return rightRisk - leftRisk;
    });

  const totalPatients = patients.length;
  const stableCount = patients.filter(p => p.status === 'stable').length;
  const criticalCount = patients.filter(p => p.status === 'critical').length;
  const queuedCount = patients.filter(p => !predictions[p.patient_id]).length;
  const activePredictionCount = patients.filter(p => predictions[p.patient_id]).length;
  const activePredictionPct = totalPatients ? Math.round((activePredictionCount / totalPatients) * 100) : 0;
  const pendingCount = Object.values(pending).filter(Boolean).length;
  const uniqueBeds = new Set(patients.map(p => p.bed_id).filter(Boolean)).size;
  const avgRisk = totalPatients
    ? Math.round(
        patients.reduce((sum, patient) => sum + resolvePatientRiskScore(patient, predictions), 0) /
          totalPatients
      )
    : 0;
  const highRiskCount = patients.filter(p => resolvePatientRiskScore(p, predictions) >= 70).length;
  const elevatedRiskCount = patients.filter(p => {
    const riskScore = resolvePatientRiskScore(p, predictions);
    return riskScore >= 40 && riskScore < 70;
  }).length;
  const controlledRiskCount = Math.max(totalPatients - highRiskCount - elevatedRiskCount, 0);
  const topFocusPatients = [...patients]
    .sort(
      (left, right) =>
        resolvePatientRiskScore(right, predictions) - resolvePatientRiskScore(left, predictions)
    )
    .slice(0, 4);

  if (selectedPatientId) {
    return <PatientDetail patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />;
  }

  if (loading) return <LoadingSkeleton lines={4} />;

  return (
    <div className="patients-container">
      <section className="patients-hero">
        <div className="patients-hero-copy">
          <div className="patients-kicker">Patient command deck</div>
          <h1>Patients, triaged with more clarity and faster action.</h1>
          <p>
            A brighter ICU census view for staff to scan risk, streaming activity, and care priorities
            without digging through the page.
          </p>
          <div className="patients-snapshot-grid">
            <SnapshotCard
              label="Patients live"
              value={totalPatients}
              note={`${uniqueBeds} active beds in the current unit`}
              tone="sky"
            />
            <SnapshotCard
              label="Model coverage"
              value={`${activePredictionPct}%`}
              note={`${activePredictionCount} patients already scored`}
              tone="mint"
            />
            <SnapshotCard
              label="Critical now"
              value={criticalCount}
              note={`${highRiskCount} high-risk trajectories flagged`}
              tone="rose"
            />
            <SnapshotCard
              label="Streaming feed"
              value={testPatientId ? 'Live' : 'Standby'}
              note={testPatientId ? `Patient ${testPatientId.slice(-6)} is refreshing every 20s` : 'API stream can be activated on demand'}
              tone="violet"
            />
          </div>
        </div>

        <div className="patients-hero-panel">
          <div className="patients-hero-panel-head">
            <span className="patients-panel-label">Cohort pulse</span>
            <span className="prediction-badge stable">shift view</span>
          </div>
          <div className="patients-hero-risk-value">{avgRisk}%</div>
          <div className="patients-hero-risk-copy">
            average modeled risk across the currently tracked patient cohort
          </div>
          <div className="patients-mix-bar">
            <div
              className="patients-mix-segment critical"
              style={{ width: `${totalPatients ? (highRiskCount / totalPatients) * 100 : 0}%` }}
            />
            <div
              className="patients-mix-segment warning"
              style={{ width: `${totalPatients ? (elevatedRiskCount / totalPatients) * 100 : 0}%` }}
            />
            <div
              className="patients-mix-segment stable"
              style={{ width: `${totalPatients ? (controlledRiskCount / totalPatients) * 100 : 0}%` }}
            />
          </div>
          <div className="patients-mix-legend">
            <span><i className="critical" /> {highRiskCount} high risk</span>
            <span><i className="warning" /> {elevatedRiskCount} elevated</span>
            <span><i className="stable" /> {controlledRiskCount} controlled</span>
          </div>
          <div className="patients-panel-foot">
            <span>{pendingCount} models refreshing</span>
            <span>{modelAlerts.length} live AI alerts</span>
            <span>{stableCount} marked stable</span>
          </div>
        </div>
      </section>

      {error && <ErrorBanner msg={error} />}

      <section className="patients-command-card">
        <div className="patients-command-main">
          <div className="patients-search-wrap">
          <input
            type="text"
            className="input-field patients-search-input"
            placeholder="Search by patient, diagnosis, or bed..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          </div>
          <div className="patients-filter-row">
            {['all', 'stable', 'critical'].map(f => (
            <button
              key={f}
              className={`patients-filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all'
                ? `All (${patients.length})`
                : f === 'stable'
                ? `Stable (${patients.filter(p => p.status === 'stable').length})`
                : `Critical (${patients.filter(p => p.status === 'critical').length})`}
            </button>
          ))}
          </div>
        </div>
        <div className="patients-command-actions">
          {criticalCount > 0 && (
            <GenerateReportButton
              mode="high-risk"
              selectedPatients={patients}
              variant="ghost"
              label={`Report ${criticalCount} Critical`}
              onGenerate={(pts) => {
                if (pts.length > 0) handleOpenReport(pts[0]);
              }}
            />
          )}
          <button className="btn btn-primary" onClick={() => setShowAdmit(true)}>
            + Admit Patient
          </button>
          {!testPatientId && (
            <button
              className="btn btn-ghost"
              onClick={handleGenerateTestPatient}
              disabled={isGeneratingTest}
              title="Add patient from API stream (refreshes every 20 seconds)"
            >
              {isGeneratingTest ? 'Generating stream patient...' : 'Add Patient from API'}
            </button>
          )}
          {testPatientId && (
            <div className="patients-stream-pill">
              Streaming patient active / {testPatientId.slice(-6)} / auto-refresh every 20s
            </div>
          )}
        </div>
      </section>

      {topFocusPatients.length > 0 && (
        <section className="patients-focus-board">
          <div className="patients-section-head">
            <div>
              <h2>Priority Focus Rail</h2>
              <p>Bring the highest-risk patients closer to the top for shift handoffs and rapid review.</p>
            </div>
            <div className="patients-section-meta">
              <span>{queuedCount} awaiting AI score</span>
              <span>{pendingCount} refreshing</span>
            </div>
          </div>
          <div className="patients-focus-grid">
            {topFocusPatients.map(patient => (
              <FocusPatientCard
                key={patient.patient_id}
                patient={patient}
                predictions={predictions}
                onOpen={setSelectedPatientId}
              />
            ))}
          </div>
        </section>
      )}

      <div className="patients-list-head">
        <div>
          <h2>Care Floor</h2>
          <p>
            {filtered.length} patients shown / {filter === 'all' ? 'full census' : `${filter} cohort`} /{' '}
            search-aware triage ordering
          </p>
        </div>
        <div className="patients-list-meta">
          <span>{activePredictionCount} scored</span>
          <span>{modelAlerts.length} AI alerts</span>
          <span>{criticalCount} critical status</span>
        </div>
      </div>

      <div className="grid grid-cols-2 patients-grid">
        {filtered.map((p, i) => {
          const prediction = predictions[p.patient_id];
          const patientTrend = summarizeTrend(predictionHistory[p.patient_id] || []);
          const patientAlert = modelAlerts.find(alert => alert.patient_id === p.patient_id);
          const riskScore = Math.round(resolvePatientRiskScore(p, predictions));
          const riskTone = getRiskTone(riskScore);

          return (
            <div
              key={p.patient_id}
              className={`patient-card tone-${riskTone}`}
              style={{
                animation: 'fadeInUp 0.4s ease-out both',
                animationDelay: `${i * 0.05}s`,
                '--mouse-x': mousePos.x * 100 + '%',
                '--mouse-y': mousePos.y * 100 + '%',
                '--patient-accent': RISK_COLOR(riskScore),
              }}
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({
                  x: (e.clientX - rect.left) / rect.width,
                  y: (e.clientY - rect.top) / rect.height,
                });
              }}
            >
              <div className="patient-card-header">
                <div
                  className="patient-avatar"
                  style={{
                    background: `linear-gradient(135deg, ${
                      AVT_COLORS[i % AVT_COLORS.length]
                    }, ${AVT_COLORS[(i + 1) % AVT_COLORS.length]})`,
                  }}
                >
                  {p.name
                    ?.split(' ')
                    .map(n => n[0])
                    .join('')}
                </div>
                <div className="patient-card-main">
                  <div className="patient-card-name-row">
                    <div className="patient-card-name">{p.name}</div>
                    <span className={`patient-status-pill tone-${p.status === 'critical' ? 'critical' : 'stable'}`}>
                      {p.status || 'Observed'}
                    </span>
                  </div>
                  <div className="patient-card-demographics">
                    {p.gender} · {p.age}y · {p.patient_id}
                  </div>
                  <div className="patient-card-diagnosis">{p.diagnosis}</div>
                </div>
                <div className="patient-card-risk">
                  <div className="patient-risk-value" style={{ color: RISK_COLOR(riskScore) }}>
                    {riskScore}%
                  </div>
                  <div className={`prediction-badge ${riskTone}`}>
                    {pending[p.patient_id] ? 'Refreshing' : prediction?.risk?.label || 'Queued'}
                  </div>
                </div>
              </div>

              <div className="patient-chip-row">
                <span className="patient-chip">Bed {p.bed_id || '--'}</span>
                <span className="patient-chip">{prediction?.escalation?.level || 'Routine review'}</span>
                {testPatientId === p.patient_id && <span className="patient-chip tone-info">Streaming API</span>}
              </div>

              <div className="vitals-mini-grid">
                {[
                  { label: 'HR', value: `${p.latest_vitals?.heart_rate ?? '--'}`, unit: 'bpm' },
                  { label: 'SpO₂', value: `${p.latest_vitals?.spo2 ?? '--'}`, unit: '%' },
                  { label: 'BP', value: `${p.latest_vitals?.blood_pressure_sys ?? '--'}`, unit: 'mmHg' },
                  { label: 'Temp', value: `${p.latest_vitals?.temperature ?? '--'}`, unit: '°C' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="vital-cell">
                    <div className="vital-value">
                      {value}
                      <span className="vital-unit">{unit}</span>
                    </div>
                    <div className="vital-label">{label}</div>
                  </div>
                ))}
              </div>

              <div className="patient-insight-grid">
                {[
                  ['Model', pending[p.patient_id] ? 'Refreshing' : prediction?.risk?.label || 'Queued'],
                  ['7-Day Risk', prediction ? formatPercent(prediction.risk.riskPercentage) : `${riskScore}%`],
                  ['Trend', prediction ? formatTrendText(patientTrend) : 'Stable'],
                  ['Escalation', prediction?.escalation?.level || 'Routine'],
                ].map(([label, value]) => (
                  <div key={label} className="patient-insight-cell">
                    <div className="patient-insight-label">{label}</div>
                    <div
                      className="patient-insight-value"
                      style={{
                        color:
                          label === '7-Day Risk'
                            ? RISK_COLOR(prediction?.risk?.riskPercentage || riskScore)
                            : 'var(--text-primary)',
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {(patientAlert || predictionErrors[p.patient_id]) && (
                <div className={`patient-alert ${predictionErrors[p.patient_id] ? 'error' : 'warning'}`}>
                  {predictionErrors[p.patient_id] || patientAlert?.top_factor}
                </div>
              )}

              <div className="patient-card-footer">
                <div className="patient-card-footnote">
                  <span>Admitted {new Date(p.admitted_at).toLocaleDateString()}</span>
                  <span>{prediction ? formatTrendText(patientTrend) : 'Initial triage pending'}</span>
                </div>
                <div className="patient-actions">
                  <GenerateReportButton
                    mode="single"
                    patient={p}
                    variant="inline"
                    onGenerate={(pts) => handleOpenReport(pts[0])}
                  />
                  <button
                    className="btn-nasa primary"
                    onClick={() => {
                      setSelectedPatientId(p.patient_id);
                    }}
                  >
                    Open →
                  </button>
                  <button className="btn-nasa" onClick={() => setShowDischarge(p)}>
                    Discharge
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <EmptyState icon="🏥" message="No patients found matching your criteria" />
      )}

      {/* ── Report Modal ── */}
      {reportTarget && (
        <PatientReportModal
          patient={reportTarget.patient}
          vitalsHistory={reportTarget.vitalsHistory}
          prediction={reportTarget.prediction}
          onClose={() => setReportTarget(null)}
        />
      )}

      {/* Admit Modal */}
      {showAdmit && (
        <div className="modal-overlay" onClick={() => setShowAdmit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Admit Patient to ICU</span>
              <button className="modal-close" onClick={() => setShowAdmit(false)}>✕</button>
            </div>
            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              A baseline vitals and labs snapshot will be generated from the diagnosis so the AI risk engine can score this patient immediately after admission.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Full Name</label>
                <input
                  className="input-field"
                  value={admitForm.name}
                  onChange={e => setAdmitForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Patient full name"
                />
              </div>
              <div>
                <label className="form-label">Age</label>
                <input
                  className="input-field"
                  type="number"
                  value={admitForm.age}
                  onChange={e => setAdmitForm(p => ({ ...p, age: e.target.value }))}
                  placeholder="Years"
                />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select
                  className="input-field"
                  value={admitForm.gender}
                  onChange={e => setAdmitForm(p => ({ ...p, gender: e.target.value }))}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Primary Diagnosis</label>
                <input
                  className="input-field"
                  value={admitForm.diagnosis}
                  onChange={e => setAdmitForm(p => ({ ...p, diagnosis: e.target.value }))}
                  placeholder="e.g., Septic Shock"
                />
              </div>
              <div>
                <label className="form-label">Assigned Bed</label>
                <input
                  className="input-field"
                  value={admitForm.bed_id}
                  onChange={e => setAdmitForm(p => ({ ...p, bed_id: e.target.value }))}
                  placeholder="ICU-03"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdmit(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdmit}>Confirm Admission</button>
            </div>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {showDischarge && (
        <div className="modal-overlay" onClick={() => setShowDischarge(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Discharge Patient</span>
              <button className="modal-close" onClick={() => setShowDischarge(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                You are about to discharge:
              </p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
                {showDischarge.name}
              </p>
              <p style={{ color: 'var(--warning-500)', fontSize: '0.75rem' }}>
                ⚠ This will remove the patient from the ICU registry
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDischarge(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDischarge(showDischarge.patient_id)}>
                Confirm Discharge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;
