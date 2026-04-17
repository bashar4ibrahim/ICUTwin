import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './Resources.css';

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

function Resources() {
  const [resources, setResources] = useState([]);
  const [activeType, setActiveType] = useState('All');
  const [simulationForm, setSimulationForm] = useState({ scenario: 'pandemic_surge', extra_beds: 5, extra_ventilators: 0, extra_staff: 0, surge_percent: 30 });
  const [simulationResult, setSimulationResult] = useState(null);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResources = () => {
    setLoading(true);
    apiFetch('/icu/resources')
      .then(d => setResources(d.resources || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchResources(); }, []);

  const updateResource = async (resourceId, status) => {
    try {
      await apiFetch(`/icu/resources/${resourceId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      fetchResources();
    } catch (e) {
      setError(e.message);
    }
  };

  const runSimulation = async () => {
    try {
      setRunningSimulation(true);
      const params = new URLSearchParams({
        scenario: simulationForm.scenario,
        extra_beds: String(simulationForm.extra_beds),
        extra_ventilators: String(simulationForm.extra_ventilators),
        extra_staff: String(simulationForm.extra_staff),
        surge_percent: String(simulationForm.surge_percent),
      });
      const response = await apiFetch(`/icu/simulation/whatif?${params.toString()}`, { method: 'POST' });
      setSimulationResult(response);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunningSimulation(false);
    }
  };

  const types = ['All', ...new Set(resources.map(r => r.type))];
  const filtered = activeType === 'All' ? resources : resources.filter(r => r.type === activeType);

  if (loading) return <LoadingSkeleton lines={3} />;

  return (
    <div className="resources-page" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="page-header">
        <h1>ICU Resources</h1>
        <p>Beds · Ventilators · Monitors — Live Status</p>
        <div className="page-subtitle-bar" />
      </div>

      {error && <ErrorBanner msg={error} />}

      {/* Simulation Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-title">What-If Capacity Simulation</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div>
            <label className="form-label">Scenario</label>
            <select className="input-field" value={simulationForm.scenario} onChange={e => setSimulationForm(prev => ({ ...prev, scenario: e.target.value }))}>
              {['pandemic_surge', 'mass_casualty', 'equipment_failure', 'staff_shortage'].map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>
          {[
            ['surge_percent', 'Surge %'],
            ['extra_beds', 'Extra Beds'],
            ['extra_ventilators', 'Extra Vents'],
            ['extra_staff', 'Extra Staff'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <input className="input-field" type="number" value={simulationForm[key]} onChange={e => setSimulationForm(prev => ({ ...prev, [key]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={runSimulation} disabled={runningSimulation}>
          {runningSimulation ? 'Running Simulation...' : 'Run What-If Analysis'}
        </button>

        {simulationResult && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
              {[
                ['Risk Level', simulationResult.risk_level || 'Unknown'],
                ['Beds Available', simulationResult.projected_capacity?.beds_available ?? '—'],
                ['Vents Available', simulationResult.projected_capacity?.ventilators_available ?? '—'],
                ['Scenario', simulationResult.scenario || simulationForm.scenario],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 'var(--space-1)' }}>{value}</div>
                </div>
              ))}
            </div>
            {simulationResult.recommendation && (
              <div style={{ marginTop: 'var(--space-3)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {simulationResult.recommendation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resource Tabs */}
      <div className="tab-row">
        {types.map(t => (
          <button key={t} className={`tab-btn ${activeType === t ? 'active' : ''}`} onClick={() => setActiveType(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Resource Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-tertiary)' }}>
            <tr>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resource</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const statusColors = {
                available: '#10b981',
                occupied: '#00bcd4',
                in_use: '#f43f5e',
                maintenance: '#f59e0b',
              };
              return (
                <tr key={r.resource_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>{r.resource_id}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.type}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ color: statusColors[r.status] || 'var(--text-tertiary)' }}>
                      ● {r.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.patient_id || '—'}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <select
                      className="input-field"
                      value={r.status}
                      onChange={e => updateResource(r.resource_id, e.target.value)}
                      style={{ width: '120px', padding: 'var(--space-1) var(--space-2)', fontSize: '0.75rem' }}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon="📦" message="No resources found" />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. AI RISK - Premium AI Risk Engine
// ─────────────────────────────────────────────────────────────────────────────

export default Resources;


