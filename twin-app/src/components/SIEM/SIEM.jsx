import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './SIEM.css';

import {
  API_BASE,
  WS_BASE,
  apiFetch,
  getToken,
  resolveServiceUrl,
  CUSTOM_AI_MODEL_ENDPOINT,
  CUSTOM_AI_MODEL_NAME,
  CUSTOM_MODEL_INPUT_GROUPS,
  CUSTOM_MODEL_MOCK_CASES,
  createCustomModelDraft,
  getDefaultCustomModelInputs,
  prepareCustomModelRequest,
  predictCustomAiModel,
  AUTO_PREDICTION_DEBOUNCE_MS,
  CLINICAL_INTELLIGENCE_STORAGE_KEY,
  answerClinicalQuestion,
  assembleAutoModelInputs,
  buildAuditEntry,
  buildEscalation,
  buildPredictionSignature,
  buildSyntheticAlert,
  createPredictionRecord,
  getRiskTone,
  mergePatientSnapshot,
  summarizeTrend,
  AVT_COLORS,
  MODEL_INPUT_LOOKUP,
  CUSTOM_MODEL_ENDPOINT_LABEL,
  formatNumeric,
  formatPercent,
  formatDateTime,
  formatTrendText,
  formatBackendStatus,
  normalizeChatHistory,
  normalizeVitalsPayload,
  riskBadgeTone,
  RISK_COLOR,
  NAV_ITEMS,
  CHART_CONFIGS,
  QUICK_PROMPTS,
} from '../../app/shared';

import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../EmptyState/EmptyState';
import ErrorBanner from '../ErrorBanner/ErrorBanner';

function SIEM() {
  const [activeTab, setActiveTab] = useState('audit');
  const [events, setEvents] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [showLogEvent, setShowLogEvent] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventForm, setEventForm] = useState({ event_type: 'failed_auth', source_ip: '192.168.1.45', user_id: '', resource: '/auth/login', description: '', severity: 'WARNING' });
  const [incForm, setIncForm] = useState({ title: '', severity: 'HIGH', description: '' });

  const refreshSiemData = useCallback(() => (
    Promise.all([
      apiFetch('/siem/alerts'),
      apiFetch('/siem/anomalies'),
      apiFetch('/siem/audit-log'),
    ]).then(([e, a, al]) => {
      setEvents(e.alerts || []);
      setAnomalies(a.anomalies || []);
      setAuditLog(al.audit_log || []);
    }).catch(err => setError(err.message))
  ), []);

  useEffect(() => {
    setLoading(true);
    refreshSiemData().finally(() => setLoading(false));
  }, [refreshSiemData]);

  if (loading) return <LoadingSkeleton lines={4} />;

  const sevColor = { CRITICAL: '#f43f5e', HIGH: '#f43f5e', WARNING: '#f59e0b', MEDIUM: '#f59e0b', INFO: '#00bcd4', LOW: '#10b981' };

  return (
    <div className="siem-page" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="page-header">
        <h1>SIEM Security</h1>
        <p>Security Information & Event Management</p>
        <div className="page-subtitle-bar" />
      </div>

      {error && <ErrorBanner msg={error} />}

      {/* Stats */}
      <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Active Alerts', value: events.length, color: '#f43f5e' },
          { label: 'Anomalies', value: anomalies.length, color: '#f59e0b' },
          { label: 'Audit Entries', value: auditLog.length, color: '#00bcd4' },
          { label: 'Incidents', value: incidents.length, color: '#10b981' },
        ].map(stat => (
          <div key={stat.label} className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-row">
        {[
          ['audit', 'Audit Log'],
          ['anomalies', 'Anomalies'],
          ['alerts', 'Active Alerts'],
        ].map(([id, label]) => (
          <button key={id} className={`tab-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
        <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setShowLogEvent(true)}>+ Log Event</button>
        <button className="btn btn-sm btn-primary" onClick={() => setShowReport(true)}>+ Report Incident</button>
      </div>

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-tertiary)' }}>
              <tr>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Time</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Action</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>User</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map(entry => (
                <tr key={entry.audit_id || entry.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatDateTime(entry.at)}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent-400)' }}>{entry.action}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem' }}>{entry.by || entry.user_id || 'System'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.event_id || entry.incident_id || '—'}</td>
                </tr>
              ))}
              {auditLog.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-8)' }}><EmptyState icon="📋" message="No audit entries" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {anomalies.map(anomaly => (
            <div key={anomaly.anomaly_id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: '1.5rem' }}>🔍</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{anomaly.type}</span>
                    <span className="badge badge-warning">Risk: {anomaly.risk_score}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>{anomaly.description}</p>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>{anomaly.detected_at} · {anomaly.model}</div>
                </div>
              </div>
            </div>
          ))}
          {anomalies.length === 0 && <EmptyState icon="✓" message="No anomalies detected" />}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {events.map(event => (
            <div key={event.event_id} className="card" style={{ borderLeft: `3px solid ${sevColor[event.severity] || 'var(--accent-500)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{event.event_type}</span>
                  <span className={`badge badge-${event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 'critical' : event.severity === 'WARNING' || event.severity === 'MEDIUM' ? 'warning' : 'info'}`} style={{ marginLeft: 'var(--space-2)' }}>
                    {event.severity}
                  </span>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => {
                  apiFetch(`/siem/alerts/${event.event_id}/acknowledge`, { method: 'PUT' }).then(refreshSiemData);
                }}>Acknowledge</button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>{event.description}</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>{event.source_ip} · {event.timestamp}</div>
            </div>
          ))}
          {events.length === 0 && <EmptyState icon="✓" message="No unacknowledged alerts" />}
        </div>
      )}

      {/* Log Event Modal */}
      {showLogEvent && (
        <div className="modal-overlay" onClick={() => setShowLogEvent(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Log Security Event</span>
              <button className="modal-close" onClick={() => setShowLogEvent(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <input className="input-field" placeholder="Event Type" value={eventForm.event_type} onChange={e => setEventForm(p => ({ ...p, event_type: e.target.value }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <input className="input-field" placeholder="Source IP" value={eventForm.source_ip} onChange={e => setEventForm(p => ({ ...p, source_ip: e.target.value }))} />
                <select className="input-field" value={eventForm.severity} onChange={e => setEventForm(p => ({ ...p, severity: e.target.value }))}>
                  <option>INFO</option><option>WARNING</option><option>CRITICAL</option>
                </select>
              </div>
              <input className="input-field" placeholder="User ID (optional)" value={eventForm.user_id} onChange={e => setEventForm(p => ({ ...p, user_id: e.target.value }))} />
              <input className="input-field" placeholder="Resource" value={eventForm.resource} onChange={e => setEventForm(p => ({ ...p, resource: e.target.value }))} />
              <textarea className="input-field" rows={3} placeholder="Description" value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowLogEvent(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                await apiFetch('/siem/events', { method: 'POST', body: JSON.stringify(eventForm) });
                setShowLogEvent(false);
                refreshSiemData();
              }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Incident Modal */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Report Incident</span>
              <button className="modal-close" onClick={() => setShowReport(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <input className="input-field" placeholder="Title" value={incForm.title} onChange={e => setIncForm(p => ({ ...p, title: e.target.value }))} />
              <select className="input-field" value={incForm.severity} onChange={e => setIncForm(p => ({ ...p, severity: e.target.value }))}>
                <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
              </select>
              <textarea className="input-field" rows={3} placeholder="Description" value={incForm.description} onChange={e => setIncForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowReport(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                await apiFetch('/siem/incidents', { method: 'POST', body: JSON.stringify(incForm) });
                setShowReport(false);
              }}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. CHATBOT - Premium AI Assistant
// ─────────────────────────────────────────────────────────────────────────────

export default SIEM;


