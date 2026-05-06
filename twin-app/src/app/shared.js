import {
  API_BASE,
  WS_BASE,
  apiFetch,
  getToken,
  resolveServiceUrl,
} from '../services/api';
import {
  CUSTOM_AI_MODEL_ENDPOINT,
  CUSTOM_AI_MODEL_NAME,
  CUSTOM_MODEL_INPUT_GROUPS,
  CUSTOM_MODEL_MOCK_CASES,
  createCustomModelDraft,
  getDefaultCustomModelInputs,
  prepareCustomModelRequest,
  predictCustomAiModel,
} from '../services/aiModels';
import {
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
} from '../services/clinicalIntelligence';
const AVT_COLORS = ['#00bcd4', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#84cc16'];
const MODEL_INPUT_LOOKUP = Object.fromEntries(
  CUSTOM_MODEL_INPUT_GROUPS.flatMap((group) =>
    group.fields.map((field) => [field.key, field])
  )
);
const CUSTOM_MODEL_ENDPOINT_LABEL = resolveServiceUrl(API_BASE, CUSTOM_AI_MODEL_ENDPOINT);

const formatNumeric = (value, suffix = '') => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  const display = Number.isInteger(numeric) ? numeric.toString() : numeric.toFixed(1);
  return `${display}${suffix}`;
};

const formatPercent = (value) => formatNumeric(value, '%');

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
};

const formatTrendText = (trend) => {
  if (!trend) return 'Stable';
  if (trend.direction === 'up') return `Worsening +${formatNumeric(Math.abs(trend.delta))} pts`;
  if (trend.direction === 'down') return `Improving -${formatNumeric(Math.abs(trend.delta))} pts`;
  return 'Stable';
};

const formatBackendStatus = (payload) => {
  if (!payload) return 'Connected';
  if (typeof payload === 'string') return payload;
  return payload.message || payload.status || payload.title || payload.detail || 'Connected';
};

const normalizeChatHistory = (payload) => {
  const candidates = payload?.history || payload?.messages || payload?.conversation || payload?.items || [];
  if (!Array.isArray(candidates)) return [];

  return candidates
    .map((entry) => {
      if (typeof entry === 'string') return { role: 'assistant', text: entry };
      if (!entry || typeof entry !== 'object') return null;
      const role = entry.role || entry.sender || 'assistant';
      const text = entry.text || entry.message || entry.content || entry.answer || '';
      return text ? { role, text } : null;
    })
    .filter(Boolean);
};

const normalizeVitalsPayload = (reading = {}) => ({
  heart_rate: Number(reading.heart_rate ?? 0),
  blood_pressure_sys: Number(reading.blood_pressure_sys ?? 0),
  blood_pressure_dia: Number(reading.blood_pressure_dia ?? 0),
  spo2: Number(reading.spo2 ?? 0),
  respiratory_rate: Number(reading.respiratory_rate ?? 0),
  temperature: Number(reading.temperature ?? 0),
});

const riskBadgeTone = (label = '') => {
  const normalized = String(label).toUpperCase();
  if (normalized.includes('CRIT') || normalized.includes('HIGH')) return 'critical';
  if (normalized.includes('MODERATE') || normalized.includes('WARN')) return 'warning';
  return 'stable';
};

const RISK_COLOR = v => v > 70 ? '#f43f5e' : v > 40 ? '#f59e0b' : '#10b981';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '⬡', label: 'Dashboard', section: 'OVERVIEW' },
  { id: 'patients', icon: '👤', label: 'ICU Patients', section: 'CLINICAL' },
  { id: 'vitals', icon: '💓', label: 'Vitals Monitor', section: 'CLINICAL' },
  { id: 'resources', icon: '🛏', label: 'Resources', section: 'CLINICAL' },
  { id: 'ai', icon: '🤖', label: 'AI Risk Engine', section: 'INTELLIGENCE' },
  { id: 'siem', icon: '🔒', label: 'SIEM Security', section: 'SECURITY' },
  { id: 'oracle', icon: '🔮', label: 'Oracle Assessment', section: 'INTELLIGENCE' },
  { id: 'chatbot', icon: '💬', label: 'ICU Assistant', section: 'TOOLS' },
  { id: 'testdealing', icon: '🎨', label: 'Test Dealing', section: 'TOOLS' },
  {
    id: 'signing',
    icon: '✍️',
    label: 'Digital Signing',
    section: 'TOOLS',
    description: 'Open the SignFlow signing workspace',
  },
];

const CHART_CONFIGS = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', color: '#f43f5e', normalRange: [60, 100] },
  { key: 'spo2', label: 'SpO₂ Saturation', unit: '%', color: '#10b981', normalRange: [95, 100] },
  { key: 'blood_pressure_sys', label: 'Systolic BP', unit: 'mmHg', color: '#00bcd4', normalRange: [90, 140] },
  { key: 'respiratory_rate', label: 'Respiratory Rate', unit: '/min', color: '#f59e0b', normalRange: [12, 20] },
];

const QUICK_PROMPTS = [
  'How many ICU beds are available?',
  'Which patients are at risk right now?',
  'Why is P001 high risk?',
  'What changed in the last 6 hours?',
  'Is there a ventilator available?',
  'Give me the ICU resource summary',
  'Any critical patients?',
];
export {
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
};
