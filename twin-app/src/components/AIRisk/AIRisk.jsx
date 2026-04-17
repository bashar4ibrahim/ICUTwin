import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import './AIRisk.css';
import {
  apiFetch, formatPercent, formatDateTime, RISK_COLOR, getRiskTone,
  summarizeTrend, formatTrendText,
} from '../../app/shared';
import { useClinicalIntelligence } from '../ClinicalIntelligenceProvider/ClinicalIntelligenceProvider';
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../EmptyState/EmptyState';
import ErrorBanner from '../ErrorBanner/ErrorBanner';

// ==================== Particle Background ====================
const RiskParticles = ({ patients, predictions }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrame;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();

    const avgRisk = patients.reduce((acc, p) => acc + (predictions[p.patient_id]?.risk?.riskPercentage || 0), 0) / (patients.length || 1);
    const particleCount = Math.floor(20 + avgRisk / 5);

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + Math.random() * 200,
          size: 2 + Math.random() * 6,
          speed: 0.5 + Math.random() * 2,
          color: avgRisk > 70 ? '#ff2d55' : avgRisk > 40 ? '#ff9500' : '#0066ff',
          opacity: 0.3 + Math.random() * 0.5,
        });
      }
    };
    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [patients, predictions]);
  return <canvas ref={canvasRef} id="riskParticles" />;
};

// ==================== 3D Risk Card ====================
const RiskCardIsometric = ({ patient, prediction, trend, historyData, isSelected, onClick }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  const riskValue = prediction?.risk?.riskPercentage || 0;
  const color = RISK_COLOR(riskValue);
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (riskValue / 100) * circumference;

  return (
    <motion.div
      className={`risk-card-isometric ${isSelected ? 'selected' : ''}`}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="card-header-iso">
        <svg width="90" height="90" viewBox="0 0 100 100" className="risk-ring-iso">
          <circle cx={50} cy={50} r={38} fill="none" stroke="#e2e8f0" strokeWidth={5} />
          <motion.circle
            cx={50} cy={50} r={38} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            transform="rotate(-90 50 50)"
          />
          <text x={50} y={55} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--lumina-text)">{riskValue}%</text>
        </svg>
        <div className="patient-info-iso">
          <h3>{patient.name}</h3>
          <span className="diagnosis">{patient.diagnosis} · {patient.bed_id}</span>
        </div>
      </div>
      <div className="vitals-row-iso">
        <div className="vital-item-iso"><span className="vital-value-iso">{patient.latest_vitals?.heart_rate || '--'}</span><span className="vital-label-iso">HR</span></div>
        <div className="vital-item-iso"><span className="vital-value-iso">{patient.latest_vitals?.spo2 || '--'}%</span><span className="vital-label-iso">SpO₂</span></div>
        <div className="vital-item-iso"><span className="vital-value-iso" style={{ color: trend === 'rising' ? '#ff2d55' : trend === 'falling' ? '#30d158' : 'inherit' }}>{formatTrendText(trend)}</span><span className="vital-label-iso">Trend</span></div>
      </div>
      {/* Sparkline */}
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: 36 }}>
        <motion.polyline
          points={historyData.map((v, i) => `${(i/(historyData.length-1))*100},${30 - (v/100)*25}`).join(' ')}
          fill="none" stroke={color} strokeWidth="2.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }}
        />
      </svg>
    </motion.div>
  );
};

// ==================== Organ Map ====================
const OrganMap = ({ vitals }) => {
  const organs = [
    { name: 'Cardiovascular', icon: '❤️', status: vitals?.heart_rate > 110 ? 'critical' : vitals?.heart_rate > 100 ? 'warning' : 'stable' },
    { name: 'Respiratory', icon: '🫁', status: vitals?.spo2 < 92 ? 'critical' : vitals?.spo2 < 95 ? 'warning' : 'stable' },
    { name: 'Renal', icon: '🧪', status: 'stable' },
    { name: 'Neurological', icon: '🧠', status: 'stable' },
  ];
  return (
    <div className="organ-map">
      {organs.map(org => (
        <div key={org.name} className="organ-node">
          <span className="organ-icon">{org.icon}</span>
          <span>{org.name}</span>
          <span className={`organ-status ${org.status}`} />
        </div>
      ))}
    </div>
  );
};

// ==================== Main Component ====================
function AIRisk() {
  const { snapshots, predictions, history: predictionHistory, alerts: sharedAlerts, auditLog, pending, errors, runPredictionForPatient, recordFeedback, registerPatients } = useClinicalIntelligence();
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('matrix');
  const [expandedExplain, setExpandedExplain] = useState(null);

  const combinedAlerts = useMemo(() => {
    const all = [...(sharedAlerts || []), ...(alerts || [])];
    return all.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [sharedAlerts, alerts]);

  useEffect(() => {
    Promise.all([apiFetch('/icu/patients'), apiFetch('/icu/ai/alerts')])
      .then(([p, a]) => {
        setPatients(p.patients || []);
        registerPatients(p.patients || [], 'ai-risk');
        setAlerts(a.alerts || []);
        if (p.patients?.length) setSelectedId(p.patients[0].patient_id);
      }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const [expandedAlerts, setExpandedAlerts] = useState({});
  const [expandedAuditEntries, setExpandedAuditEntries] = useState({});

  const selectedPatient = patients.find(p => p.patient_id === selectedId);
  const selectedPrediction = selectedId ? predictions[selectedId] : null;
  const selectedHistory = selectedId ? predictionHistory[selectedId] || [] : [];

  if (loading) return <LoadingSkeleton lines={6} />;

  return (
    <div className="ai-risk-container">
      <RiskParticles patients={patients} predictions={predictions} />
      
      {/* Hero Split */}
      <div className="risk-hero-split">
        <div className="hero-left">
          <motion.h1 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <span className="gradient-text">AI Risk</span><br />Command Center
          </motion.h1>
          <motion.p initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>Real‑time clinical intelligence · Predictive analytics · Sepsis detection</motion.p>
        </div>
        <div className="hero-right">
          <div className="hero-stats-ring">
            <div className="stat-ring"><div className="ring-value">{patients.length}</div><div className="ring-label">Patients</div></div>
            <div className="stat-ring"><div className="ring-value">{Object.keys(predictions).length}</div><div className="ring-label">Predictions</div></div>
            <div className="stat-ring"><div className="ring-value">{sharedAlerts.length + alerts.length}</div><div className="ring-label">Alerts</div></div>
          </div>
        </div>
      </div>

      {/* Morphing Tabs */}
      <div className="tab-morph">
        <div className="tab-morph-container">
          {['matrix', 'heatmap', 'explain', 'alerts', 'audit'].map(tab => (
            <button key={tab} className={`tab-morph-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'matrix' && '🎯 Risk Matrix'}
              {tab === 'heatmap' && '🔥 Heatmap'}
              {tab === 'explain' && '🔬 Explain'}
              {tab === 'alerts' && `🚨 Alerts (${sharedAlerts.length + alerts.length})`}
              {tab === 'audit' && '📋 Audit'}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Carousel */}
      <div className="patient-carousel">
        <div className="carousel-track">
          {patients.map(p => {
            const pred = predictions[p.patient_id];
            const risk = pred?.risk?.riskPercentage || 0;
            return (
              <motion.div
                key={p.patient_id}
                className={`patient-card-horizontal ${selectedId === p.patient_id ? 'active' : ''}`}
                onClick={() => setSelectedId(p.patient_id)}
                whileHover={{ y: -8 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="patient-avatar-large">{p.name?.charAt(0)}</div>
                <div className="patient-name">{p.name.split(' ')[0]}</div>
                <div className="patient-risk-mini">
                  <span style={{ color: RISK_COLOR(risk), fontWeight: 700 }}>{risk}%</span>
                  <div className="risk-bar-mini"><div className="risk-fill-mini" style={{ width: `${risk}%`, background: RISK_COLOR(risk) }} /></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'matrix' && (
          <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="risk-grid-isometric">
            {patients.map(p => {
              const pred = predictions[p.patient_id];
              if (!pred) return null;
              const trend = summarizeTrend(predictionHistory[p.patient_id] || []);
              const historyData = (predictionHistory[p.patient_id] || []).slice(-6).map(h => h.risk.riskPercentage);
              return <RiskCardIsometric key={p.patient_id} patient={p} prediction={pred} trend={trend} historyData={historyData} isSelected={selectedId === p.patient_id} onClick={() => setSelectedId(p.patient_id)} />;
            })}
          </motion.div>
        )}

      {activeTab === 'heatmap' && (
  <motion.div
    key="heatmap"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="heatmap-premium-container"
  >
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        <span style={{ background: 'linear-gradient(135deg, var(--lumina-primary), var(--lumina-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔥 Risk Heatmap</span>
      </h2>
      <p style={{ color: 'var(--lumina-text-soft)' }}>Each tile represents a patient. Darker tiles indicate higher risk. Click any tile to view details.</p>
    </div>

    <div className="heatmap-premium-grid">
      {patients.map((p, index) => {
        const pred = predictions[p.patient_id];
        const risk = pred?.risk?.riskPercentage || 0;
        const riskColor = RISK_COLOR(risk);
        const riskLabel = pred?.risk?.label || 'Unknown';
        const bgIntensity = risk >= 70 ? 0.15 : risk >= 40 ? 0.08 : 0.03;
        const bgColor = risk >= 70 ? '#fef2f2' : risk >= 40 ? '#fffbeb' : '#f0fdf4';
        const borderColor = risk >= 70 ? '#fca5a5' : risk >= 40 ? '#fcd34d' : '#86efac';

        return (
          <motion.div
            key={p.patient_id}
            className="heatmap-tile"
            style={{ 
              '--risk-color': riskColor,
              backgroundColor: bgColor,
              borderColor: borderColor,
              animationDelay: `${index * 0.03}s`,
            }}
            onClick={() => { setSelectedId(p.patient_id); setActiveTab('matrix'); }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
              e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
            }}
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="heatmap-value" style={{ '--risk-color': riskColor }}>
              {risk}%
            </div>
            <div className="heatmap-name">{p.name.split(' ')[0]}</div>
            <div className="heatmap-bed">Bed {p.bed_id}</div>
            <div className="heatmap-bar">
              <motion.div 
                className="heatmap-bar-fill" 
                style={{ '--risk-color': riskColor }}
                initial={{ width: 0 }}
                animate={{ width: `${risk}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <div className="heatmap-badge" style={{ color: riskColor }}>
              {riskLabel}
            </div>
            {/* Glow effect on high risk */}
            {risk >= 70 && (
              <motion.div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 28,
                  boxShadow: `0 0 30px ${riskColor}`,
                  opacity: 0.3,
                  pointerEvents: 'none',
                }}
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  </motion.div>
)}

        {activeTab === 'explain' && selectedPrediction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="explain-accordion">
            <h2 style={{ marginBottom: '1.5rem' }}>Explainability · {selectedPatient?.name}</h2>
            {selectedPrediction.featureImportance ? Object.entries(selectedPrediction.featureImportance).map(([name, value]) => (
              <div key={name} className="explain-item">
                <div className="explain-header" onClick={() => setExpandedExplain(expandedExplain === name ? null : name)}>
                  <span>{name}</span>
                  <span style={{ color: value > 0 ? '#ff2d55' : '#30d158' }}>{value > 0 ? '+' : ''}{Math.round(value * 100)}%</span>
                </div>
                <AnimatePresence>
                  {expandedExplain === name && (
                    <motion.div className="explain-content" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
                      <p>Impact: {value > 0 ? 'Increases' : 'Decreases'} risk by {Math.abs(Math.round(value * 100))}%</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )) : <EmptyState icon="📊" message="No feature data" />}
            {selectedPatient && <OrganMap vitals={selectedPatient.latest_vitals} />}
          </motion.div>
        )}

       {activeTab === 'alerts' && (
  <motion.div
    key="alerts"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="alerts-premium-container"
  >
    <div className="alerts-header">
      <h2>🚨 Active Clinical Alerts</h2>
      <p>{combinedAlerts.length} urgent notifications requiring attention</p>
    </div>

    <div className="alerts-timeline">
      {combinedAlerts.map((alert, index) => {
        const riskScore = alert.risk_score || 0;
        const alertColor = RISK_COLOR(riskScore);
        const isCritical = riskScore >= 70;
        const alertId = alert.alert_id || alert.patient_id;
        const isExpanded = expandedAlerts[alertId] || false;

        return (
          <motion.div
            key={alertId}
            className={`alert-card-premium ${isCritical ? 'critical' : ''}`}
            style={{ 
              '--alert-color': alertColor,
              animationDelay: `${index * 0.08}s`,
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
              e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
            }}
            onClick={() => setExpandedAlerts(prev => ({ ...prev, [alertId]: !isExpanded }))}
            whileHover={{ x: 8 }}
          >
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div className="alert-header">
                  <span className="alert-icon">{isCritical ? '🔴' : '🟡'}</span>
                  <div className="alert-title">
                    <h3>{alert.name}</h3>
                    <span className="alert-category" style={{ background: alertColor }}>
                      {alert.category}
                    </span>
                  </div>
                </div>

                <div className="alert-details">
                  <div className="alert-factor">
                    <span className="factor-label">Top Factor</span>
                    <span className="factor-value">{alert.top_factor || 'No data'}</span>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="alert-factor">
                          <span className="factor-label">Bed</span>
                          <span className="factor-value">{alert.bed_id}</span>
                        </div>
                        <div className="alert-factor">
                          <span className="factor-label">Patient</span>
                          <span className="factor-value">{alert.name}</span>
                        </div>
                        {alert.timestamp && (
                          <div className="alert-factor">
                            <span className="factor-label">Time</span>
                            <span className="factor-value">{formatDateTime(alert.timestamp)}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="alert-actions">
                  <button className="alert-action-chip primary" onClick={(e) => { e.stopPropagation(); /* acknowledge */ }}>
                    ✓ Acknowledge
                  </button>
                  <button className="alert-action-chip" onClick={(e) => { e.stopPropagation(); setSelectedId(alert.patient_id); setActiveTab('matrix'); }}>
                    👁 View Patient
                  </button>
                  <button className="alert-action-chip" onClick={(e) => e.stopPropagation()}>
                    📋 Escalate
                  </button>
                </div>
              </div>

              <div className="alert-score">
                <div className="alert-score-value" style={{ color: alertColor }}>
                  {riskScore}
                </div>
                <div className="alert-score-label">Risk Score</div>
              </div>
            </div>

            {/* Expand indicator */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: '0.5rem',
                right: '1rem',
                fontSize: '1.2rem',
                color: 'var(--lumina-text-soft)',
              }}
              animate={{ rotate: isExpanded ? 180 : 0 }}
            >
              ▼
            </motion.div>
          </motion.div>
        );
      })}

      {combinedAlerts.length === 0 && (
        <EmptyState icon="✅" message="No active alerts – system is stable." />
      )}
    </div>
  </motion.div>
)}
        {activeTab === 'audit' && (
  <motion.div
    key="audit"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="audit-premium-container"
  >
    <div className="audit-header">
      <h2>📋 Clinical Audit Trail</h2>
      <p>Complete history of predictions, feedback, alerts, and system events</p>
    </div>

    {/* Search Bar */}
    <div className="audit-search">
      <input type="text" placeholder="Search by patient, action, or date..." />
      <button>🔍 Search</button>
    </div>

    {/* Filter Chips */}
    <div className="audit-filters">
      {['All', 'Prediction', 'Feedback', 'Alert', 'System'].map(filter => (
        <button key={filter} className={`audit-filter-chip ${filter === 'All' ? 'active' : ''}`}>
          {filter}
        </button>
      ))}
    </div>

    {/* Timeline */}
    <div className="audit-timeline">
      {(() => {
        // Group by date
        const grouped = auditLog.reduce((acc, entry) => {
          const date = formatDateTime(entry.at).split(' ')[0];
          if (!acc[date]) acc[date] = [];
          acc[date].push(entry);
          return acc;
        }, {});
        
        return Object.entries(grouped).map(([date, entries]) => (
          <div key={date} className="audit-date-group">
            <div className="audit-date-label">
              <span>{date}</span>
            </div>
            {entries.map((entry, index) => {
              const actionColor = 
                entry.action.includes('Prediction') ? '#0ea5e9' :
                entry.action.includes('Feedback') ? '#8b5cf6' :
                entry.action.includes('Alert') ? '#ef4444' : '#10b981';
              
              const actionIcon = 
                entry.action.includes('Prediction') ? '🔮' :
                entry.action.includes('Feedback') ? '💬' :
                entry.action.includes('Alert') ? '🚨' : '⚙️';
              
              const isExpanded = expandedAuditEntries[entry.audit_id] || false;

              return (
                <motion.div
                  key={entry.audit_id}
                  className="audit-card-premium"
                  style={{ 
                    '--action-color': actionColor,
                    animationDelay: `${index * 0.03}s`,
                  }}
                  onClick={() => setExpandedAuditEntries(prev => ({ ...prev, [entry.audit_id]: !isExpanded }))}
                  whileHover={{ x: 6 }}
                >
                  <div style={{ display: 'flex' }}>
                    <div className="audit-icon" style={{ background: actionColor }}>
                      {actionIcon}
                    </div>
                    <div className="audit-content">
                      <div className="audit-title">
                        <strong>{entry.patient_name}</strong>
                        <span className="audit-badge" style={{ background: actionColor }}>
                          {entry.action.split(':')[0]}
                        </span>
                      </div>
                      <div className="audit-meta">
                        <span>🕐 {formatDateTime(entry.at)}</span>
                        <span>👤 {entry.actor_email || 'system'}</span>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className="audit-detail"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            {entry.action}
                            {entry.details && <p style={{ marginTop: '0.5rem' }}>{entry.details}</p>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.div
                      style={{ fontSize: '1.2rem', color: 'var(--lumina-text-soft)' }}
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                    >
                      ▼
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ));
      })()}
      
      {auditLog.length === 0 && (
        <EmptyState icon="📋" message="No audit entries recorded yet." />
      )}
    </div>
  </motion.div>
)}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button className="fab-ai" onClick={() => selectedId && runPredictionForPatient(selectedId, 'manual')} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>⟳</motion.button>
    </div>
  );
}

export default AIRisk;