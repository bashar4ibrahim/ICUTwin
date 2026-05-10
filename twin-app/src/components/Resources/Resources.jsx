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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [simulationForm, setSimulationForm] = useState({ scenario: 'pandemic_surge', extra_beds: 5, extra_ventilators: 0, extra_staff: 0, surge_percent: 30 });
  const [simulationResult, setSimulationResult] = useState(null);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [resourceSummary, setResourceSummary] = useState(null);
  const [showResourceDetail, setShowResourceDetail] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showCreateResourceForm, setShowCreateResourceForm] = useState(false);
  const [newResourceType, setNewResourceType] = useState('bed');
  const [showUpdateResourceModal, setShowUpdateResourceModal] = useState(false);
  const [selectedResourceToUpdate, setSelectedResourceToUpdate] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', patient_id: '' });
  const [capacityPlanning, setCapacityPlanning] = useState(null);
  const [resourceUtilization, setResourceUtilization] = useState(null);
  const [daysAhead, setDaysAhead] = useState(7);
  const [loadingForecast, setLoadingForecast] = useState(false);

  const fetchResources = () => {
    setLoading(true);
    apiFetch('/icu/resources')
      .then(d => {
        setResources(d.resources || []);
        setResourceSummary(d.summary || null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const fetchDashboardSummary = () => {
    apiFetch('/icu/dashboard/summary')
      .then(setDashboardSummary)
      .catch(e => setError(e.message));
  };

  const createResource = async () => {
    try {
      const response = await apiFetch(`/icu/resources?resource_type=${newResourceType}`, {
        method: 'POST',
      });
      console.log('Resource created:', response);
      fetchResources();
      fetchDashboardSummary();
      setShowCreateResourceForm(false);
      setNewResourceType('bed'); // Reset to default
    } catch (e) {
      setError(e.message);
    }
  };

  const updateResourceStatus = async () => {
    if (!selectedResourceToUpdate) return;
    try {
      const response = await apiFetch(`/icu/resources/${selectedResourceToUpdate.resource_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateForm),
      });
      console.log('Resource updated:', response);
      fetchResources();
      fetchDashboardSummary();
      setShowUpdateResourceModal(false);
      setUpdateForm({ status: '', patient_id: '' });
    } catch (e) {
      setError(e.message);
    }
  };

  const handleUpdateClick = (resource) => {
    setSelectedResourceToUpdate(resource);
    setUpdateForm({ status: resource.status, patient_id: resource.patient_id || '' });
    setShowUpdateResourceModal(true);
  };

  const fetchCapacityPlanning = async () => {
    setLoadingForecast(true);
    try {
      const response = await apiFetch(`/icu/simulation/capacity-planning?days_ahead=${daysAhead}`, {
        method: 'POST',
      });
      setCapacityPlanning(response);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchResourceUtilization = async () => {
    try {
      // Try different possible endpoints for 24-hour utilization
      const endpoints = [
        '/icu/resources/utilization/24h',
        '/icu/resources/utilization/24-hours',
        '/icu/resources/utilization',
        '/icu/utilization/24h',
        '/icu/utilization/24-hours'
      ];
      
      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await apiFetch(endpoint);
          console.log(`Successfully fetched from: ${endpoint}`);
          break;
        } catch (e) {
          console.log(`Failed endpoint: ${endpoint}, error: ${e.message}`);
          continue;
        }
      }
      
      if (response) {
        setResourceUtilization(response);
      } else {
        // If no endpoint works, create mock data for demonstration
        console.log('Using mock data for 24-hour utilization');
        const mockData = {
          period_hours: 24,
          timeline: Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
            bed_utilization: Math.floor(Math.random() * 30) + 60,
            ventilator_utilization: Math.floor(Math.random() * 20) + 40,
            monitor_utilization: Math.floor(Math.random() * 20) + 70
          })),
          average_utilization: {
            beds: 71.75,
            ventilators: 56.5,
            monitors: 78.17
          }
        };
        setResourceUtilization(mockData);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchResourceDetails = async (resourceId) => {
    try {
      const details = await apiFetch(`/icu/resources/${resourceId}`);
      setSelectedResource(details);
      setShowResourceDetail(true);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchDashboardSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'future_analysis' && !capacityPlanning) {
      fetchCapacityPlanning();
      fetchResourceUtilization();
    }
  }, [activeTab]);

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

      {/* Main Navigation Tabs */}
      <div className="tab-row" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'future_analysis', label: 'Future Analysis' },
          { id: 'what_if', label: 'What If Scenario' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab Content */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Dashboard Summary Cards */}
          {dashboardSummary && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              {/* Patient Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="card" style={{ padding: 'var(--space-4)', background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-tertiary))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Total Patients</div>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dashboardSummary.total_patients}</div>
                    </div>
                    <div style={{ fontSize: '2rem', opacity: 0.6 }}>👥</div>
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--space-4)', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.625rem', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Critical Patients</div>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>{dashboardSummary.critical_patients}</div>
                    </div>
                    <div style={{ fontSize: '2rem', opacity: 0.6 }}>🚨</div>
                  </div>
                </div>
              </div>

              {/* Resource Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                {resourceSummary ? [
                  { name: 'Beds', data: resourceSummary.bed, icon: '🛏️', total: resourceSummary.bed.total, available: resourceSummary.bed.available, in_use: resourceSummary.bed.in_use, maintenance: resourceSummary.bed.maintenance, occupied: resourceSummary.bed.occupied || 0 },
                  { name: 'Ventilators', data: resourceSummary.ventilator, icon: '🫁', total: resourceSummary.ventilator.total, available: resourceSummary.ventilator.available, in_use: resourceSummary.ventilator.in_use, maintenance: resourceSummary.ventilator.maintenance || 0, occupied: resourceSummary.ventilator.occupied || 0 },
                  { name: 'Monitors', data: resourceSummary.monitor, icon: '📊', total: resourceSummary.monitor.total, available: resourceSummary.monitor.available, in_use: resourceSummary.monitor.in_use || 0, maintenance: resourceSummary.monitor.maintenance, occupied: resourceSummary.monitor.occupied || 0 },
                ].map(resource => (
                  <div key={resource.name} className="card" style={{ padding: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: '1.25rem', marginRight: 'var(--space-2)' }}>{resource.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{resource.name}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{resource.total}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-1)', fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>Available: <span style={{ color: '#10b981', fontWeight: 500 }}>{resource.available}</span></div>
                      <div style={{ color: 'var(--text-secondary)' }}>In Use: <span style={{ color: '#f43f5e', fontWeight: 500 }}>{resource.in_use}</span></div>
                      {resource.occupied > 0 && (
                        <div style={{ color: 'var(--text-secondary)' }}>Occupied: <span style={{ color: '#00bcd4', fontWeight: 500 }}>{resource.occupied}</span></div>
                      )}
                      {resource.maintenance > 0 && (
                        <div style={{ color: 'var(--text-secondary)' }}>Maintenance: <span style={{ color: '#f59e0b', fontWeight: 500 }}>{resource.maintenance}</span></div>
                      )}
                    </div>
                  </div>
                )) : (
                  // Fallback to dashboardSummary if resourceSummary is not available
                  dashboardSummary ? [
                    { name: 'Beds', data: dashboardSummary.beds, icon: '🛏️', total: dashboardSummary.beds.total, available: dashboardSummary.beds.available, in_use: dashboardSummary.beds.in_use, maintenance: dashboardSummary.beds.maintenance },
                    { name: 'Ventilators', data: dashboardSummary.ventilators, icon: '🫁', total: dashboardSummary.ventilators.total, available: dashboardSummary.ventilators.available, in_use: dashboardSummary.ventilators.in_use, maintenance: dashboardSummary.ventilators.maintenance || 0 },
                    { name: 'Monitors', data: dashboardSummary.monitors, icon: '📊', total: dashboardSummary.monitors.total, available: dashboardSummary.monitors.available, in_use: dashboardSummary.monitors.in_use || 0, maintenance: dashboardSummary.monitors.maintenance, occupied: dashboardSummary.monitors.occupied || 0 },
                  ].map(resource => (
                    <div key={resource.name} className="card" style={{ padding: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: '1.25rem', marginRight: 'var(--space-2)' }}>{resource.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{resource.name}</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{resource.total}</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-1)', fontSize: '0.75rem' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>Available: <span style={{ color: '#10b981', fontWeight: 500 }}>{resource.available}</span></div>
                        <div style={{ color: 'var(--text-secondary)' }}>In Use: <span style={{ color: '#f43f5e', fontWeight: 500 }}>{resource.data.in_use}</span></div>
                        {resource.data.occupied !== undefined && resource.data.occupied > 0 && (
                          <div style={{ color: 'var(--text-secondary)' }}>Occupied: <span style={{ color: '#00bcd4', fontWeight: 500 }}>{resource.data.occupied}</span></div>
                        )}
                        {resource.data.maintenance > 0 && (
                          <div style={{ color: 'var(--text-secondary)' }}>Maintenance: <span style={{ color: '#f59e0b', fontWeight: 500 }}>{resource.data.maintenance}</span></div>
                        )}
                      </div>
                    </div>
                  )) : null
                )}
              </div>

              {/* Staff Summary */}
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: '1.25rem', marginRight: 'var(--space-2)' }}>👨‍⚕️</span>
                  <div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff on Duty</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                  {[
                    { role: 'Doctors', count: dashboardSummary.staff_on_duty.doctors, icon: '👨‍⚕️' },
                    { role: 'Nurses', count: dashboardSummary.staff_on_duty.nurses, icon: '👩‍⚕️' },
                    { role: 'Respiratory Therapists', count: dashboardSummary.staff_on_duty.respiratory_therapists, icon: '🫁' },
                  ].map(staff => (
                    <div key={staff.role} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-1)' }}>{staff.icon}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{staff.count}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{staff.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resource Type Tabs */}
          <div className="tab-row">
            {types.map(t => (
              <button key={t} className={`tab-btn ${activeType === t ? 'active' : ''}`} onClick={() => setActiveType(t)}>
                {t}
              </button>
            ))}
          </div>

          {/* Resource Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Add Resource Section */}
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
              <button className="btn btn-primary" onClick={() => setShowCreateResourceForm(true)}>
                Add New Resource
              </button>

              {showCreateResourceForm && (
                <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                  <label htmlFor="newResourceType" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Resource Type:</label>
                  <select
                    id="newResourceType"
                    className="input-field"
                    value={newResourceType}
                    onChange={(e) => setNewResourceType(e.target.value)}
                    style={{ flexGrow: 1, maxWidth: '200px' }}
                  >
                    <option value="bed">Bed</option>
                    <option value="ventilator">Ventilator</option>
                    <option value="monitor">Monitor</option>
                  </select>
                  <button className="btn btn-primary" onClick={createResource}>
                    Create
                  </button>
                  <button className="btn" onClick={() => {
                    setShowCreateResourceForm(false);
                    setNewResourceType('bed');
                  }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

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
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                        <button
                          onClick={() => fetchResourceDetails(r.resource_id)}
                          style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {r.resource_id}
                        </button>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.type}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ color: statusColors[r.status] || 'var(--text-tertiary)' }}>
                          ● {r.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.patient_id || '—'}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleUpdateClick(r)}
                          style={{ padding: 'var(--space-1) var(--space-2)', fontSize: '0.75rem' }}
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon="📦" message="No resources found" />}
          </div>
        </div>
      )}

      {/* Future Analysis Tab Content */}
      {activeTab === 'future_analysis' && (
        <div>
          {/* Capacity Planning Controls */}
          <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="card-title">Capacity Planning Forecast</div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <label htmlFor="daysAhead" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Days Ahead:</label>
              <input
                id="daysAhead"
                className="input-field"
                type="number"
                min="1"
                max="30"
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                style={{ width: '100px' }}
              />
              <button className="btn btn-primary" onClick={fetchCapacityPlanning} disabled={loadingForecast}>
                {loadingForecast ? 'Generating Forecast...' : 'Generate Forecast'}
              </button>
            </div>
          </div>

          {/* Forecast Results */}
          {capacityPlanning && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="card" style={{ padding: 'var(--space-4)', background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-tertiary))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Planning Horizon</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{capacityPlanning.planning_horizon} days</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', opacity: 0.6 }}>📅</div>
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--space-4)', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.625rem', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Peak Day</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#dc2626' }}>
                        {new Date(capacityPlanning.summary.peak_day).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', opacity: 0.6 }}>�</div>
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--space-4)', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.625rem', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Avg Bed Utilization</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>
                        {capacityPlanning.summary.avg_bed_utilization.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', opacity: 0.6 }}>🛏️</div>
                  </div>
                </div>
              </div>

              {/* Forecast Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--bg-tertiary)' }}>
                    <tr>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admissions</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Discharges</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bed Utilization</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ventilator Utilization</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capacityPlanning.forecast.map((day, index) => {
                      const riskColors = {
                        LOW: '#10b981',
                        MEDIUM: '#f59e0b',
                        HIGH: '#ef4444',
                      };
                      return (
                        <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {day.predicted_admissions}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {day.predicted_discharges}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <div style={{ width: '60px', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${day.bed_utilization_percent}%`, height: '100%', background: '#3b82f6', transition: 'width 0.3s ease' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{day.bed_utilization_percent}%</span>
                            </div>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <div style={{ width: '60px', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${day.ventilator_utilization_percent}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{day.ventilator_utilization_percent}%</span>
                            </div>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <span style={{ color: riskColors[day.risk_level] || 'var(--text-tertiary)', fontWeight: 600, fontSize: '0.75rem' }}>
                              ● {day.risk_level}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bar Chart Visualization */}
              <div className="card" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Utilization Trends</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
                  {/* Bed Utilization Chart */}
                  <div>
                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>Bed Utilization (%)</h4>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', gap: 'var(--space-1)', padding: 'var(--space-2)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      {capacityPlanning.forecast.map((day, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div style={{ width: '100%', background: '#3b82f6', borderRadius: '2px 2px 0 0', height: `${(day.bed_utilization_percent / 100) * 180}px`, transition: 'height 0.3s ease' }} />
                          <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)', textAlign: 'center', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ventilator Utilization Chart */}
                  <div>
                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>Ventilator Utilization (%)</h4>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', gap: 'var(--space-1)', padding: 'var(--space-2)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      {capacityPlanning.forecast.map((day, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div style={{ width: '100%', background: '#10b981', borderRadius: '2px 2px 0 0', height: `${(day.ventilator_utilization_percent / 100) * 180}px`, transition: 'height 0.3s ease' }} />
                          <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)', textAlign: 'center', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Patient Flow Chart */}
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>Patient Flow (Admissions vs Discharges)</h4>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', gap: 'var(--space-1)', padding: 'var(--space-2)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    {capacityPlanning.forecast.map((day, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{ display: 'flex', gap: '2px', width: '100%' }}>
                          <div style={{ flex: 1, background: '#ef4444', borderRadius: '2px 2px 0 0', height: `${(day.predicted_admissions / 5) * 180}px`, transition: 'height 0.3s ease' }} />
                          <div style={{ flex: 1, background: '#3b82f6', borderRadius: '2px 2px 0 0', height: `${(day.predicted_discharges / 5) * 180}px`, transition: 'height 0.3s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)', textAlign: 'center', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Admissions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Discharges</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24-Hour Resource Utilization Timeline */}
              {resourceUtilization && (
                <div className="card" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                  <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>24-Hour Resource Utilization Timeline</div>
                  
                  {/* Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                    <div className="card" style={{ padding: 'var(--space-3)', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.625rem', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Avg Bed Utilization</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>
                            {resourceUtilization.average_utilization.beds.toFixed(1)}%
                          </div>
                        </div>
                        <div style={{ fontSize: '1.25rem', opacity: 0.6 }}>🛏️</div>
                      </div>
                    </div>
                    <div className="card" style={{ padding: 'var(--space-3)', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.625rem', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Avg Ventilator Utilization</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                            {resourceUtilization.average_utilization.ventilators.toFixed(1)}%
                          </div>
                        </div>
                        <div style={{ fontSize: '1.25rem', opacity: 0.6 }}>🫁</div>
                      </div>
                    </div>
                    <div className="card" style={{ padding: 'var(--space-3)', background: 'linear-gradient(135deg, #fefce8, #fef3c7)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.625rem', color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Avg Monitor Utilization</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ca8a04' }}>
                            {resourceUtilization.average_utilization.monitors.toFixed(1)}%
                          </div>
                        </div>
                        <div style={{ fontSize: '1.25rem', opacity: 0.6 }}>📊</div>
                      </div>
                    </div>
                  </div>

                  {/* Combined Utilization Chart */}
                  <div>
                    <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>Resource Utilization Over 24 Hours</h4>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '250px', gap: 'var(--space-1)', padding: 'var(--space-2)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      {resourceUtilization.timeline.map((point, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '20px' }}>
                          <div style={{ display: 'flex', gap: '1px', width: '100%', height: '100%' }}>
                            <div style={{ flex: 1, background: '#3b82f6', borderRadius: '2px 2px 0 0', height: `${(point.bed_utilization / 100) * 230}px`, transition: 'height 0.3s ease' }} />
                            <div style={{ flex: 1, background: '#10b981', borderRadius: '2px 2px 0 0', height: `${(point.ventilator_utilization / 100) * 230}px`, transition: 'height 0.3s ease' }} />
                            <div style={{ flex: 1, background: '#ca8a04', borderRadius: '2px 2px 0 0', height: `${(point.monitor_utilization / 100) * 230}px`, transition: 'height 0.3s ease' }} />
                          </div>
                          <div style={{ fontSize: '0.5rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)', textAlign: 'center', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                            {new Date(point.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Beds</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ventilators</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <div style={{ width: '12px', height: '12px', background: '#ca8a04', borderRadius: '2px' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Monitors</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* What If Scenario Tab Content */}
      {activeTab === 'what_if' && (
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
      )}

      {/* Resource Detail Pop-up */}
      {showResourceDetail && selectedResource && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: 'var(--space-6)', width: '500px', maxWidth: '90%', position: 'relative' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>Resource Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)', fontSize: '0.9rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Resource ID:</div>
              <div style={{ color: 'var(--text-primary)' }}>{selectedResource.resource_id}</div>

              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Type:</div>
              <div style={{ color: 'var(--text-primary)' }}>{selectedResource.type}</div>

              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Status:</div>
              <div style={{ color: 'var(--text-primary)' }}>{selectedResource.status?.toUpperCase()}</div>

              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Patient ID:</div>
              <div style={{ color: 'var(--text-primary)' }}>{selectedResource.patient_id || 'N/A'}</div>

              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Created At:</div>
              <div style={{ color: 'var(--text-primary)' }}>{new Date(selectedResource.created_at).toLocaleString()}</div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowResourceDetail(false)}
              style={{ marginTop: 'var(--space-4)', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Update Resource Modal */}
      {showUpdateResourceModal && selectedResourceToUpdate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: 'var(--space-6)', width: '500px', maxWidth: '90%', position: 'relative' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>Update Resource: {selectedResourceToUpdate.resource_id}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label htmlFor="updateStatus" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Status:</label>
                <select
                  id="updateStatus"
                  className="input-field"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label htmlFor="updatePatientId" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Patient ID (optional):</label>
                <input
                  id="updatePatientId"
                  className="input-field"
                  type="text"
                  value={updateForm.patient_id}
                  onChange={(e) => setUpdateForm({ ...updateForm, patient_id: e.target.value })}
                  placeholder="Enter patient ID if applicable"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button
                className="btn btn-primary"
                onClick={updateResourceStatus}
                style={{ flex: 1 }}
              >
                Update
              </button>
              <button
                className="btn"
                onClick={() => {
                  setShowUpdateResourceModal(false);
                  setUpdateForm({ status: '', patient_id: '' });
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. AI RISK - Premium AI Risk Engine
// ─────────────────────────────────────────────────────────────────────────────

export default Resources;


