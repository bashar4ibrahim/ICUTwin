import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Vitals.css';
import {
  API_BASE,
  WS_BASE,
  apiFetch,
  formatPercent,
  formatTrendText,
  RISK_COLOR,
  summarizeTrend,
  normalizeVitalsPayload,
  CHART_CONFIGS,
} from '../../app/shared';
import { useClinicalIntelligence } from '../ClinicalIntelligenceProvider/ClinicalIntelligenceProvider';
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../EmptyState/EmptyState';
import ErrorBanner from '../ErrorBanner/ErrorBanner';
import VitalsChart from '../VitalsChart/VitalsChart';

function Vitals({ initialPatientId }) {
  const {
    registerPatients,
    registerVitals,
    predictions,
    history: predictionHistory,
    pending,
    errors,
    runPredictionForPatient,
  } = useClinicalIntelligence();

  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(initialPatientId || null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);
  const [liveData, setLiveData] = useState({});
  const [history, setHistory] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [pushingVitals, setPushingVitals] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const wsRef = useRef(null);

  // Fetch patients
  useEffect(() => {
    apiFetch('/icu/patients').then((d) => {
      const pts = d.patients || [];
      setPatients(pts);
      registerPatients(pts, 'vitals');
      if (pts.length > 0 && !selectedId) {
        setSelectedId(pts[0].patient_id);
      }
    });
  }, [registerPatients]);

  // Fetch selected patient details
  useEffect(() => {
    if (!selectedId) return;
    apiFetch(`/icu/patients/${selectedId}`)
      .then((detail) => {
        setSelectedPatientDetail(detail);
        if (detail?.latest_vitals) {
          registerVitals(selectedId, detail.latest_vitals, 'patient-detail');
          setLiveData((prev) =>
            Object.keys(prev).length > 0 ? prev : detail.latest_vitals
          );
        }
      })
      .catch(() => setSelectedPatientDetail(null));
  }, [selectedId, registerVitals]);

  // Fetch vitals history
  useEffect(() => {
    if (!selectedId) return;
    apiFetch(`/icu/vitals/${selectedId}/history?limit=20`)
      .then((d) => {
        const readings = d.readings || [];
        setHistory(readings);
        if (readings.length > 0) {
          const latest = readings[readings.length - 1];
          setLiveData(latest);
          registerVitals(selectedId, latest, 'history');
        }
      })
      .catch(() => setHistory([]));
  }, [selectedId, registerVitals]);

  // WebSocket connection
  useEffect(() => {
    if (!selectedId) return;
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(`${WS_BASE}/icu/vitals/ws/${selectedId}`);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setLiveData(data);
      registerVitals(selectedId, data, 'ws');
      setHistory((prev) => [...prev.slice(-19), data]);
    };

    return () => ws.close();
  }, [selectedId, registerVitals]);

  const patient = selectedPatientDetail || patients.find((p) => p.patient_id === selectedId);
  const modelPrediction = selectedId ? predictions[selectedId] : null;
  const modelTrend = summarizeTrend(predictionHistory[selectedId] || []);
  const modelError = selectedId ? errors[selectedId] : '';

  const getChipStatus = (key, val) => {
    if (val === undefined || val === null) return 'stable';
    if (key === 'spo2' && val < 93) return 'danger';
    if (key === 'heart_rate' && (val > 110 || val < 50)) return 'danger';
    if (key === 'respiratory_rate' && val > 24) return 'danger';
    if (key === 'spo2' && val < 95) return 'warning';
    if (key === 'heart_rate' && val > 100) return 'warning';
    return 'stable';
  };

  const handlePushVitals = async () => {
    if (!selectedId) return;
    const sourceReading =
      Object.keys(liveData).length > 0
        ? liveData
        : history[history.length - 1] || patient?.latest_vitals;
    if (!sourceReading) return;
    setPushingVitals(true);
    try {
      await apiFetch(`/icu/vitals/${selectedId}`, {
        method: 'POST',
        body: JSON.stringify(normalizeVitalsPayload(sourceReading)),
      });
      setPushStatus('Vitals pushed successfully');
      setTimeout(() => setPushStatus(''), 3000);
    } catch (e) {
      setPushStatus(e.message);
    } finally {
      setPushingVitals(false);
    }
  };

  if (!patient) return <LoadingSkeleton lines={6} />;

  return (
    <motion.div
      className="vitals-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="page-header">
        <div className="live-indicator-premium" style={{ marginBottom: '0.75rem' }}>
          <span className="live-dot-premium" />
          {wsConnected ? 'LIVE STREAMING' : 'CONNECTING...'}
        </div>
        <h1>Vitals Command</h1>
        <p>Real‑time physiological monitoring · AI‑powered insights</p>
        <div className="page-subtitle-bar" />
      </div>

      <div
        className="vitals-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Patient Selector */}
        <div className="patient-selector-card">
          <div className="patient-selector-header">Select Patient</div>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {patients.map((p) => (
              <motion.div
                key={p.patient_id}
                className={`patient-list-item ${selectedId === p.patient_id ? 'selected' : ''}`}
                onClick={() => setSelectedId(p.patient_id)}
                whileHover={{ x: 4 }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  {p.bed_id} · {p.diagnosis}
                </div>
                {p.status === 'critical' && (
                  <span
                    className="badge badge-critical"
                    style={{ marginTop: '0.5rem', fontSize: '0.6rem' }}
                  >
                    CRITICAL
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Critical Banner */}
          {patient.status === 'critical' && (
            <motion.div
              className="critical-banner"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <span style={{ fontSize: '2rem' }}>🚨</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: '0.25rem' }}>
                  IMMEDIATE ATTENTION REQUIRED
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  {patient.name} · {patient.diagnosis} · {patient.bed_id}
                </div>
              </div>
              <span className="badge badge-critical">CRITICAL</span>
            </motion.div>
          )}

          {/* AI Clinical Intelligence */}
          <div className="ai-intel-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div className="card-title" style={{ marginBottom: '0.25rem' }}>
                  🧠 Clinical Intelligence
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Live vitals automatically refresh predictions
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={handlePushVitals}
                  disabled={!selectedId || pushingVitals}
                >
                  {pushingVitals ? 'Pushing...' : 'Push Vitals'}
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => runPredictionForPatient(selectedId, 'manual')}
                  disabled={!selectedId || pending[selectedId]}
                >
                  {pending[selectedId] ? 'Refreshing...' : '⟳ Refresh Model'}
                </button>
              </div>
            </div>

            {pushStatus && (
              <div
                style={{
                  marginBottom: '1rem',
                  fontSize: '0.75rem',
                  color: pushStatus.includes('success') ? '#10b981' : '#ef4444',
                }}
              >
                {pushStatus}
              </div>
            )}

            {modelError && <ErrorBanner msg={modelError} />}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              {[
                ['Classification', modelPrediction?.risk?.label || 'Awaiting'],
                [
                  '7-Day Risk',
                  modelPrediction ? formatPercent(modelPrediction.risk.riskPercentage) : '—',
                ],
                ['Trend', modelPrediction ? formatTrendText(modelTrend) : 'Stable'],
                ['Escalation', modelPrediction?.escalation?.level || 'Routine'],
              ].map(([label, value]) => (
                <div key={label} className="ai-metric-box">
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color:
                        label === '7-Day Risk'
                          ? RISK_COLOR(modelPrediction?.risk?.riskPercentage || 0)
                          : 'var(--text-primary)',
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {modelPrediction && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--primary-600)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Top Drivers
                  </div>
                  {(modelPrediction.advanced?.featureAttributions ||
                    modelPrediction.factors ||
                    []
                  ).slice(0, 3).map((factor, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(255,255,255,0.4)',
                        borderRadius: '12px',
                        marginBottom: '0.5rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      {factor.label || factor}
                    </div>
                  ))}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--primary-600)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Recommendations
                  </div>
                  {modelPrediction.recommendations.slice(0, 3).map((rec, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(255,255,255,0.4)',
                        borderRadius: '12px',
                        marginBottom: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Vitals Chips */}
          <div
            className="vitals-chips-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '0.75rem',
            }}
          >
            {[
              { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm' },
              { key: 'spo2', label: 'SpO₂', unit: '%' },
              { key: 'blood_pressure_sys', label: 'Systolic', unit: 'mmHg' },
              { key: 'blood_pressure_dia', label: 'Diastolic', unit: 'mmHg' },
              { key: 'respiratory_rate', label: 'Resp Rate', unit: '/min' },
              { key: 'temperature', label: 'Temp', unit: '°C' },
            ].map((chip) => {
              const val = liveData[chip.key];
              const status = getChipStatus(chip.key, val);
              return (
                <motion.div
                  key={chip.key}
                  className="vitals-chip-card"
                  whileHover={{ y: -4 }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {chip.label}
                  </div>
                  <div className={`vitals-chip-value ${status}`}>
                    {val?.toFixed ? val.toFixed(1) : val ?? '—'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--text-tertiary)',
                      marginTop: '0.25rem',
                    }}
                  >
                    {chip.unit}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Charts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
            }}
          >
            {CHART_CONFIGS.map((cfg) => (
              <motion.div
                key={cfg.key}
                className="chart-card-premium"
                whileHover={{ y: -4 }}
              >
                <div className="chart-header">
                  <span className="chart-title">{cfg.label}</span>
                  <span className="chart-value" style={{ color: cfg.color }}>
                    {liveData[cfg.key]?.toFixed(1) ?? '—'} {cfg.unit}
                  </span>
                </div>
                <VitalsChart data={history} config={cfg} height={140} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Vitals;