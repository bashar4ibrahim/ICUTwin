import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { useLocation, useNavigate } from 'react-router-dom';

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

import ToastProvider from '../ToastProvider/ToastProvider';
import ClinicalIntelligenceProvider from '../ClinicalIntelligenceProvider/ClinicalIntelligenceProvider';
import AppNavbar from '../AppNavbar';
import Login from '../Login/Login';
import PremiumPreLogin from '../PremiumPreLogin/PremiumPreLogin';
import Dashboard from '../Dashboard/Dashboard';
import Patients from '../Patients/Patients';
import Vitals from '../Vitals/Vitals';
import Resources from '../Resources/Resources';
import AIRisk from '../AIRisk/AIRisk';
import SIEM from '../SIEM/SIEM';
import Chatbot from '../Chatbot/Chatbot';
import DigitalSigning from '../DigitalSigning/DigitalSigning';
import DigitalSigningPortal from '../DigitalSigning/DigitalSigningPortal';
import FloatingAssistant from '../FloatingAssistant/FloatingAssistant';
import TestDealing from '../TestDealing/TestDealing';
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const predictionTimersRef = useRef({});
  const predictionSignaturesRef = useRef({});
  const loadedIntelligenceRef = useRef(false);
  const [clinicalIntelligence, setClinicalIntelligence] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CLINICAL_INTELLIGENCE_STORAGE_KEY) || '{}');
      return {
        snapshots: {},
        predictions: {},
        history: stored.history || {},
        alerts: [],
        auditLog: stored.auditLog || [],
        feedback: stored.feedback || [],
        pending: {},
        errors: {},
      };
    } catch {
      return {
        snapshots: {},
        predictions: {},
        history: {},
        alerts: [],
        auditLog: [],
        feedback: [],
        pending: {},
        errors: {},
      };
    }
  });
  const intelligenceRef = useRef(clinicalIntelligence);

  const handleSelectPatient = (id) => { setSelectedPatient(id); setPage('vitals'); };

  const handleLogout = async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('icu_token');
    setUser(null);
    setPage('dashboard');
    navigate('/login', { replace: true });
  };

  const handleLogin = useCallback((nextUser) => {
    setUser(nextUser);
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const token = getToken();
    if (token && !user) {
      apiFetch('/auth/me').then(me => setUser(me)).catch(() => localStorage.removeItem('icu_token'));
    }
  }, []);

  useEffect(() => {
    intelligenceRef.current = clinicalIntelligence;
    if (loadedIntelligenceRef.current) {
      localStorage.setItem(CLINICAL_INTELLIGENCE_STORAGE_KEY, JSON.stringify({
        history: clinicalIntelligence.history,
        auditLog: clinicalIntelligence.auditLog,
        feedback: clinicalIntelligence.feedback,
      }));
    } else {
      loadedIntelligenceRef.current = true;
    }
  }, [clinicalIntelligence]);

  const registerPatients = useCallback((patients, source = 'ui') => {
    setClinicalIntelligence(prev => {
      const nextSnapshots = { ...prev.snapshots };
      (patients || []).forEach(patient => {
        const existing = nextSnapshots[patient.patient_id] || {};
        nextSnapshots[patient.patient_id] = mergePatientSnapshot(existing, {
          ...patient,
          last_source: source,
          latest_vitals: patient.latest_vitals || existing.latest_vitals || {},
        });
      });
      return { ...prev, snapshots: nextSnapshots };
    });
  }, []);

  const registerVitals = useCallback((patientId, vitals, source = 'live_vitals') => {
    if (!patientId || !vitals) return;
    setClinicalIntelligence(prev => ({
      ...prev,
      snapshots: {
        ...prev.snapshots,
        [patientId]: mergePatientSnapshot(prev.snapshots[patientId] || { patient_id: patientId }, {
          patient_id: patientId,
          latest_vitals: { ...vitals, timestamp: vitals.timestamp || new Date().toISOString() },
          last_vitals_source: source,
        }),
      },
    }));
  }, []);

  const updateModelInputs = useCallback((patientId, updates = {}, source = 'manual') => {
    if (!patientId) return;
    setClinicalIntelligence(prev => {
      const existing = prev.snapshots[patientId] || { patient_id: patientId };
      return {
        ...prev,
        snapshots: {
          ...prev.snapshots,
          [patientId]: mergePatientSnapshot(existing, {
            patient_id: patientId,
            model_inputs: { ...(existing.model_inputs || {}), ...updates },
            model_input_sources: { ...(existing.model_input_sources || {}), ...Object.fromEntries(Object.keys(updates).map(k => [k, source])) },
          }),
        },
      };
    });
  }, []);

  const recordFeedback = useCallback((patientId, sentiment, note = '') => {
    if (!patientId || !sentiment) return;
    const patient = intelligenceRef.current.snapshots[patientId];
    const entry = {
      feedback_id: `feedback-${patientId}-${Date.now()}`,
      patient_id: patientId,
      patient_name: patient?.name || patientId,
      sentiment,
      note,
      at: new Date().toISOString(),
    };
    setClinicalIntelligence(prev => ({
      ...prev,
      feedback: [entry, ...prev.feedback].slice(0, 40),
      auditLog: [{
        audit_id: `feedback-audit-${patientId}-${Date.now()}`,
        patient_id: patientId,
        patient_name: patient?.name || patientId,
        action: `Clinician Feedback: ${sentiment}`,
        at: new Date().toISOString(),
      }, ...prev.auditLog].slice(0, 80),
    }));
  }, []);

  const runPredictionForPatient = useCallback(async (patientId, reason = 'auto') => {
    const snapshot = intelligenceRef.current.snapshots[patientId];
    if (!snapshot || intelligenceRef.current.pending[patientId]) return;

    const assembled = assembleAutoModelInputs(snapshot, snapshot.model_inputs || {});
    const signature = buildPredictionSignature(snapshot, assembled);

    if (reason !== 'manual' && predictionSignaturesRef.current[patientId] === signature) return;

    setClinicalIntelligence(prev => ({
      ...prev,
      pending: { ...prev.pending, [patientId]: true },
      errors: { ...prev.errors, [patientId]: '' },
    }));

    try {
      const normalized = await predictCustomAiModel({ patient: snapshot, inputs: assembled.inputs });
      predictionSignaturesRef.current[patientId] = signature;

      setClinicalIntelligence(prev => {
        const existingHistory = prev.history[patientId] || [];
        const escalation = buildEscalation(normalized, existingHistory);
        const record = createPredictionRecord(normalized, { reason, escalation, generatedAt: new Date().toISOString() });
        const nextHistory = [...existingHistory, record].slice(-24);
        const syntheticAlert = buildSyntheticAlert(snapshot, record, nextHistory);
        const nextAlerts = syntheticAlert ? [syntheticAlert, ...prev.alerts.filter(a => a.patient_id !== patientId)].slice(0, 20) : prev.alerts;
        const auditEntry = buildAuditEntry({ patient: snapshot, prediction: record, reason, history: nextHistory });

        return {
          ...prev,
          predictions: { ...prev.predictions, [patientId]: record },
          history: { ...prev.history, [patientId]: nextHistory },
          alerts: nextAlerts,
          auditLog: [auditEntry, ...prev.auditLog].slice(0, 80),
          pending: { ...prev.pending, [patientId]: false },
          errors: { ...prev.errors, [patientId]: '' },
        };
      });
    } catch (error) {
      setClinicalIntelligence(prev => ({
        ...prev,
        pending: { ...prev.pending, [patientId]: false },
        errors: { ...prev.errors, [patientId]: error.message },
      }));
    }
  }, []);

  useEffect(() => {
    Object.values(clinicalIntelligence.snapshots).forEach(snapshot => {
      if (!snapshot?.patient_id || clinicalIntelligence.pending[snapshot.patient_id]) return;

      const assembled = assembleAutoModelInputs(snapshot, snapshot.model_inputs || {});
      const signature = buildPredictionSignature(snapshot, assembled);

      if (predictionSignaturesRef.current[snapshot.patient_id] === signature) return;

      if (predictionTimersRef.current[snapshot.patient_id]) clearTimeout(predictionTimersRef.current[snapshot.patient_id]);

      predictionTimersRef.current[snapshot.patient_id] = setTimeout(() => {
        delete predictionTimersRef.current[snapshot.patient_id];
        runPredictionForPatient(snapshot.patient_id, 'auto');
      }, AUTO_PREDICTION_DEBOUNCE_MS);
    });

    return () => { Object.values(predictionTimersRef.current).forEach(timer => clearTimeout(timer)); };
  }, [clinicalIntelligence.pending, clinicalIntelligence.snapshots, runPredictionForPatient]);

  if (location.pathname.startsWith('/sign/')) {
    return <DigitalSigningPortal />;
  }

  if (!user) {
    return location.pathname === '/login'
      ? <Login onLogin={handleLogin} />
      : <PremiumPreLogin />;
  }

  const handleNavigate = (navId) => {
    setPage(navId);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNav={setPage} user={user} />;
      case 'patients': return <Patients onSelectPatient={handleSelectPatient} />;
      case 'vitals': return <Vitals initialPatientId={selectedPatient} />;
      case 'resources': return <Resources />;
      case 'ai': return <AIRisk />;
      case 'siem': return <SIEM />;
      case 'chatbot': return <Chatbot />;
      case 'testdealing': return <TestDealing />;
      case 'signing': return <DigitalSigning />;
      default: return <Dashboard onNav={setPage} user={user} />;
    }
  };

  const contextValue = {
    snapshots: clinicalIntelligence.snapshots,
    predictions: clinicalIntelligence.predictions,
    history: clinicalIntelligence.history,
    alerts: clinicalIntelligence.alerts,
    auditLog: clinicalIntelligence.auditLog,
    feedback: clinicalIntelligence.feedback,
    pending: clinicalIntelligence.pending,
    errors: clinicalIntelligence.errors,
    registerPatients,
    registerVitals,
    updateModelInputs,
    runPredictionForPatient,
    recordFeedback,
    summarizeTrend,
    getRiskTone,
  };

  return (
    <ToastProvider>
      <ClinicalIntelligenceProvider value={contextValue}>
        <div className="app-shell">
          <div className="page-bg" />
          <AppNavbar
            navItems={NAV_ITEMS}
            currentPage={page}
            onNavigate={handleNavigate}
            onOpenSettings={() => { }}
            onOpenHelp={() => { }}
            onToggleTheme={() => { }}
            themeMode="light"
            effectiveTheme="light"
            user={user}
            onLogout={handleLogout}
          />
          <main className="main-content">
            <div key={page} className="page-transition">
              {renderPage()}
            </div>
          </main>
          <FloatingAssistant onOpen={() => setPage('chatbot')} active={page === 'chatbot'} />
        </div>
      </ClinicalIntelligenceProvider>
    </ToastProvider>
  );
}


