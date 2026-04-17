// PatientDetail.jsx
import React, { useState, useEffect } from 'react';
import './PatientDetail.css';
import {
  apiFetch,
  formatDateTime,
  formatPercent,
  RISK_COLOR,
} from '../../app/shared';
import { useClinicalIntelligence } from '../ClinicalIntelligenceProvider/ClinicalIntelligenceProvider';
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../EmptyState/EmptyState';
import ErrorBanner from '../ErrorBanner/ErrorBanner';
import GenerateReportButton from './GenerateReportButton';
import PatientReportModal from './PatientReportModal';
import Timeline from '../Timeline/Timeline';

// ────────────────────────────────────────────────
// Error Boundary
// ────────────────────────────────────────────────
class PatientDetailErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('PatientDetail error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3>⚠️ Something went wrong</h3>
          <p style={{ color: 'var(--danger-500)' }}>{this.state.error?.message}</p>
          <button className="btn-nasa primary" onClick={this.props.onBack}>
            Return to Patients
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ────────────────────────────────────────────────
// Risk Gauge
// ────────────────────────────────────────────────
const RiskGauge = ({ value = 0, size = 120 }) => {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (safeValue / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-default)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r="45" fill="none"
        stroke={RISK_COLOR(safeValue)}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${RISK_COLOR(safeValue)})` }}
      />
      <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">
        {safeValue}%
      </text>
    </svg>
  );
};

// ────────────────────────────────────────────────
// Organ Card
// ────────────────────────────────────────────────
const OrganCard = ({ name, status = 'stable', value, icon }) => {
  const statusColor =
    status === 'critical' ? 'var(--danger-500)' : status === 'warning' ? 'var(--warning-500)' : 'var(--success-500)';
  return (
    <div className="organ-card">
      <div className="organ-icon">{icon}</div>
      <div className="organ-info">
        <div className="organ-name">{name}</div>
        <div className="organ-value" style={{ color: statusColor }}>{value || '--'}</div>
        <div className="organ-status" style={{ backgroundColor: statusColor }}>{status}</div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
// Sparkline
// ────────────────────────────────────────────────
const Sparkline = ({ data = [], color = 'var(--primary-500)' }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="sparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
function PatientDetail({ patientId, onBack }) {
  const {
    predictions,
    history,
    runPredictionForPatient,
    pending,
    recordFeedback,
  } = useClinicalIntelligence();

  const [patient, setPatient] = useState(null);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Report modal state
  const [showReport, setShowReport] = useState(false);

  const isValidId = patientId && typeof patientId === 'string' && patientId.trim() !== '';

  // Refs for polling intervals
  const pollingIntervalsRef = React.useRef({});

  useEffect(() => {
    if (!isValidId) {
      setError('Invalid or missing patient ID');
      setLoading(false);
      return;
    }

    // Initial data fetch
    const loadData = async () => {
      setLoading(true);
      setError('');

      Promise.allSettled([
        apiFetch(`/icu/patients/${patientId}`),
        apiFetch(`/icu/vitals/${patientId}/history`),
      ])
        .then(([patientResult, vitalsResult]) => {
          if (patientResult.status === 'rejected') {
            throw new Error(patientResult.reason?.message || 'Failed to load patient');
          }
          const patientData = patientResult.value;
          if (!patientData) throw new Error('Patient not found');
          setPatient(patientData);

          if (vitalsResult.status === 'fulfilled') {
            setVitalsHistory(vitalsResult.value.history || []);
          } else {
            console.warn('Vitals history unavailable:', vitalsResult.reason);
            setVitalsHistory([]);
          }
          setError('');
        })
        .catch(e => {
          setError(e.message);
          setPatient(null);
        })
        .finally(() => setLoading(false));
    };

    loadData();

    // Set up polling to refresh patient data and vitals every 10 seconds
    const patientPollingInterval = setInterval(() => {
      Promise.allSettled([
        apiFetch(`/icu/patients/${patientId}`),
        apiFetch(`/icu/vitals/${patientId}/history`),
      ])
        .then(([patientResult, vitalsResult]) => {
          if (patientResult.status === 'fulfilled' && patientResult.value) {
            setPatient(patientResult.value);
          }
          if (vitalsResult.status === 'fulfilled') {
            setVitalsHistory(vitalsResult.value.history || []);
          }
        })
        .catch(e => console.warn('Auto-poll error:', e));
    }, 10000);

    pollingIntervalsRef.current[patientId] = patientPollingInterval;

    return () => {
      if (pollingIntervalsRef.current[patientId]) {
        clearInterval(pollingIntervalsRef.current[patientId]);
        delete pollingIntervalsRef.current[patientId];
      }
    };
  }, [patientId, isValidId]);

  // Cleanup all polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingIntervalsRef.current).forEach(intervalId => {
        clearInterval(intervalId);
      });
      pollingIntervalsRef.current = {};
    };
  }, []);

  if (!isValidId) {
    return (
      <EmptyState
        icon="🫀"
        message="No patient selected"
        action={<button className="btn-nasa primary" onClick={onBack}>Back to Patients</button>}
      />
    );
  }

  if (loading) return <LoadingSkeleton lines={8} />;
  if (error) return <ErrorBanner msg={error} onRetry={onBack} />;
  if (!patient) return <EmptyState icon="🫀" message="Patient not found" />;

  const prediction = predictions[patientId];
  const patientHistory = history[patientId] || [];
  const latestVitals = patient.latest_vitals || {};
  const isPending = pending[patientId];

  const hrTrend    = vitalsHistory.slice(-12).map(v => v.heart_rate).filter(v => v != null);
  const spo2Trend  = vitalsHistory.slice(-12).map(v => v.spo2).filter(v => v != null);
  const bpSysTrend = vitalsHistory.slice(-12).map(v => v.blood_pressure_sys).filter(v => v != null);

  return (
    <div className="patient-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-nasa" onClick={onBack}>← Back</button>
        <div className="live-indicator">
          <span className="live-dot" />
          LIVE MONITORING · {patient.bed_id || 'Unknown Bed'}
        </div>
      </div>

      {/* Hero Section */}
      <div className="patient-hero">
        <div className="hero-left">
          <div className={`patient-avatar-large ${patient.status || 'stable'}`}>
            {patient.name?.split(' ').map(n => n[0]).join('') || '?'}
          </div>
          <div>
            <h1 className="patient-name">{patient.name || 'Unknown'}</h1>
            <div className="patient-meta">
              <span>{patient.age || '?'}y · {patient.gender || 'Unknown'}</span>
              <span className="separator">•</span>
              <span>ID: {patient.patient_id}</span>
              <span className="separator">•</span>
              <span className={`badge badge-${patient.status || 'stable'}`}>{patient.status || 'stable'}</span>
            </div>
            <p className="patient-diagnosis">{patient.diagnosis || 'No diagnosis'}</p>
            {/* Generate Report button in hero */}
            <div style={{ marginTop: '1rem' }}>
              <GenerateReportButton
                mode="single"
                patient={patient}
                variant="primary"
                label="Generate Clinical Report"
                onGenerate={() => setShowReport(true)}
              />
            </div>
          </div>
        </div>
        <div className="hero-right">
          <RiskGauge value={prediction?.risk?.riskPercentage} />
          <div style={{ textAlign: 'center' }}>
            <div className="risk-label">7-Day Deterioration Risk</div>
            <button
              className="btn-nasa primary"
              onClick={() => runPredictionForPatient(patientId, 'manual')}
              disabled={isPending}
            >
              {isPending ? 'Updating...' : 'Refresh AI Prediction'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {['overview', 'vitals', 'ai insights', 'timeline'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="card-glass">
              <h3>🧬 Organ Systems Status</h3>
              <div className="organs-grid">
                <OrganCard
                  name="Cardiovascular"
                  status={latestVitals.heart_rate > 110 ? 'warning' : 'stable'}
                  value={`${latestVitals.heart_rate ?? '--'} bpm`}
                  icon="❤️"
                />
                <OrganCard
                  name="Respiratory"
                  status={latestVitals.spo2 < 92 ? 'critical' : 'stable'}
                  value={`${latestVitals.spo2 ?? '--'}%`}
                  icon="🫁"
                />
                <OrganCard name="Renal" status="stable" value="Cr 1.2 mg/dL" icon="🧪" />
                <OrganCard name="Neurological" status="stable" value="GCS 15" icon="🧠" />
              </div>
            </div>

            <div className="card-glass">
              <h3>📊 Vitals Trend (Last 12h)</h3>
              <div className="vitals-trend-grid">
                <div className="trend-item">
                  <span>Heart Rate</span>
                  <Sparkline data={hrTrend} color="#ef4444" />
                  <strong>{latestVitals.heart_rate ?? '--'} bpm</strong>
                </div>
                <div className="trend-item">
                  <span>SpO₂</span>
                  <Sparkline data={spo2Trend} color="#0ea5e9" />
                  <strong>{latestVitals.spo2 ?? '--'}%</strong>
                </div>
                <div className="trend-item">
                  <span>BP (Sys)</span>
                  <Sparkline data={bpSysTrend} color="#14b8a6" />
                  <strong>{latestVitals.blood_pressure_sys ?? '--'} mmHg</strong>
                </div>
              </div>
            </div>

            <div className="card-glass ai-summary">
              <h3>🤖 AI Clinical Intelligence</h3>
              {prediction ? (
                <>
                  <p><strong>Risk Level:</strong> {prediction.risk.label} ({formatPercent(prediction.risk.riskPercentage)})</p>
                  <p><strong>Top Factor:</strong> {prediction.top_factor || 'N/A'}</p>
                  <p><strong>Recommendation:</strong> {prediction.recommendation || 'Continue monitoring'}</p>
                  <div className="confidence-bar">
                    <span>Model Confidence</span>
                    <div className="bar"><div style={{ width: `${prediction.confidence || 92}%` }} /></div>
                  </div>
                </>
              ) : (
                <p>No prediction available. Click "Refresh AI Prediction" above.</p>
              )}
            </div>

            <div className="card-glass">
              <h3>⚡ Quick Actions</h3>
              <div className="quick-actions">
                <button className="btn-nasa">📋 Order Labs</button>
                <button className="btn-nasa">💊 Adjust Meds</button>
                <button className="btn-nasa">📝 Add Note</button>
                <button
                  className="btn-nasa"
                  onClick={() => recordFeedback(patientId, 'stable', 'Clinician review')}
                >
                  👍 Mark Stable
                </button>
                {/* Generate Report in quick actions */}
                <GenerateReportButton
                  mode="single"
                  patient={patient}
                  variant="ghost"
                  label="Generate Report"
                  onGenerate={() => setShowReport(true)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="card-glass full-width">
            <h3>📈 Vitals History</h3>
            <div className="vitals-table-wrapper">
              <table className="vitals-table">
                <thead>
                  <tr><th>Time</th><th>HR</th><th>BP</th><th>SpO₂</th><th>RR</th><th>Temp</th></tr>
                </thead>
                <tbody>
                  {vitalsHistory.slice(0, 10).map((v, i) => (
                    <tr key={i}>
                      <td>{formatDateTime(v.timestamp)}</td>
                      <td>{v.heart_rate ?? '--'}</td>
                      <td>{v.blood_pressure_sys ?? '--'}/{v.blood_pressure_dia ?? '--'}</td>
                      <td>{v.spo2 ?? '--'}%</td>
                      <td>{v.respiratory_rate ?? '--'}</td>
                      <td>{v.temperature ?? '--'}°C</td>
                    </tr>
                  ))}
                  {vitalsHistory.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>No vitals recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ai insights' && (
          <div className="insights-grid">
            <div className="card-glass">
              <h3>🧠 Risk Evolution</h3>
              {patientHistory.length > 0 ? (
                patientHistory.map((rec, i) => (
                  <div key={i} className="timeline-entry">
                    <span>{formatDateTime(rec.generatedAt)}</span>
                    <span style={{ color: RISK_COLOR(rec.risk.riskPercentage) }}>
                      {rec.risk.label} ({rec.risk.riskPercentage}%)
                    </span>
                  </div>
                ))
              ) : (
                <p>No historical predictions</p>
              )}
            </div>
            <div className="card-glass">
              <h3>📋 Model Input Factors</h3>
              <pre style={{ fontSize: '0.8rem' }}>{JSON.stringify(patient.model_inputs || {}, null, 2)}</pre>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="card-glass full-width">
            <Timeline 
              patient={patient}
              vitalsHistory={vitalsHistory}
              patientHistory={patientHistory}
            />
          </div>
        )}
      </div>

      {/* ── Report Modal ── */}
      {showReport && (
        <PatientReportModal
          patient={patient}
          vitalsHistory={vitalsHistory}
          prediction={prediction}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

export default function PatientDetailWithBoundary(props) {
  return (
    <PatientDetailErrorBoundary onBack={props.onBack}>
      <PatientDetail {...props} />
    </PatientDetailErrorBoundary>
  );
}