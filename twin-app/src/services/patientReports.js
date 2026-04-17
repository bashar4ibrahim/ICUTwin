import { getRiskTone, summarizeTrend } from './clinicalIntelligence';

export const REPORT_PLACEHOLDER = 'Not available';
const REPORT_KEYWORDS = [
  'report',
  'patient report',
  'summary',
  'patient summary',
  'clinical summary',
  'clinical report',
  'full patient summary',
  'full clinical report',
  'document',
];
const REPORT_SYSTEM_NAME = 'ICU Digital Twin';
const REPORT_SYSTEM_SUBTITLE = 'Clinical Documentation Workspace';
const REPORT_GENERATOR_NAME = 'ICU Digital Twin Report Engine';
const REPORT_DISCLAIMER =
  'This report is generated from connected ICU APIs and synchronized frontend state. It supports review and presentation and does not replace clinician judgment.';

const valueOrFallback = (value, fallback = REPORT_PLACEHOLDER) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  return value;
};

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === null || value === undefined || value === '') return [];
  return [value];
};

const pickFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatNumber = (value, digits = 1) => {
  const numeric = toNumberOrNull(value);
  if (numeric === null) return REPORT_PLACEHOLDER;
  return Number.isInteger(numeric) ? `${numeric}` : numeric.toFixed(digits);
};

const formatMetric = (value, unit = '') => {
  const display = formatNumber(value);
  return display === REPORT_PLACEHOLDER ? REPORT_PLACEHOLDER : `${display}${unit}`;
};

const formatDateTime = (value) => {
  if (!value) return REPORT_PLACEHOLDER;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return REPORT_PLACEHOLDER;
  return date.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return REPORT_PLACEHOLDER;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return REPORT_PLACEHOLDER;
  return date.toLocaleDateString();
};

const formatPercent = (value) => {
  const numeric = toNumberOrNull(value);
  if (numeric === null) return REPORT_PLACEHOLDER;
  return `${Math.round(numeric)}%`;
};

const sentenceCase = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const stripIdentifier = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const normalizePatientDetailPayload = (payload) => {
  if (!payload) return {};
  if (payload.patient && typeof payload.patient === 'object') return payload.patient;
  return payload;
};

export const normalizeVitalsHistoryPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.readings)) return payload.readings;
  if (Array.isArray(payload?.history)) return payload.history;
  return [];
};

const normalizeAiAlertsPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.alerts)) return payload.alerts;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const normalizeLosPayload = (payload) => {
  if (!payload) return null;
  if (payload.prediction && typeof payload.prediction === 'object') return payload.prediction;
  return payload;
};
const extractPatientIdentifier = (query) => {
  const match = String(query || '').match(/\b([a-z]{0,4}\d{1,6})\b/i);
  return match ? match[1].toUpperCase() : null;
};

const pickPatientFromQuery = (query, patients = [], preferredPatientId = null) => {
  if (preferredPatientId) {
    const preferred = patients.find((patient) => patient.patient_id === preferredPatientId);
    if (preferred) return preferred;
  }

  const normalizedQuery = String(query || '');
  const compactQuery = stripIdentifier(normalizedQuery);
  const explicitMatch = patients.find((patient) => {
    const patientId = stripIdentifier(patient.patient_id);
    if (!patientId) return false;
    if (compactQuery.includes(patientId)) return true;
    const numericId = patientId.replace(/^[a-z]+/i, '').replace(/^0+/, '');
    return numericId ? compactQuery.includes(numericId) : false;
  });
  if (explicitMatch) return explicitMatch;

  const nameMatch = patients.find((patient) =>
    normalizedQuery.toLowerCase().includes(String(patient.name || '').toLowerCase())
  );
  if (nameMatch) return nameMatch;

  return patients.length === 1 ? patients[0] : null;
};

const latestVitalsSnapshot = (patient = {}, detail = {}, vitalsHistory = []) => {
  const historyLatest = Array.isArray(vitalsHistory) && vitalsHistory.length > 0 ? vitalsHistory[vitalsHistory.length - 1] : null;
  return historyLatest || detail.latest_vitals || patient.latest_vitals || {};
};

const buildBloodPressure = (vitals = {}) => {
  const sys = vitals.blood_pressure_sys ?? vitals.systolic_bp ?? vitals.systolic;
  const dia = vitals.blood_pressure_dia ?? vitals.diastolic_bp ?? vitals.diastolic;
  if (sys === null || sys === undefined || dia === null || dia === undefined) return REPORT_PLACEHOLDER;
  return `${formatNumber(sys, 0)}/${formatNumber(dia, 0)} mmHg`;
};

const buildVitalsMetrics = (vitals = {}) => [
  {
    label: 'Heart Rate',
    value: formatMetric(vitals.heart_rate, ' bpm'),
  },
  {
    label: 'Blood Pressure',
    value: buildBloodPressure(vitals),
  },
  {
    label: 'Respiratory Rate',
    value: formatMetric(vitals.respiratory_rate, ' /min'),
  },
  {
    label: 'Temperature',
    value: formatMetric(vitals.temperature, ' °C'),
  },
  {
    label: 'SpO2',
    value: formatMetric(vitals.spo2, '%'),
  },
  {
    label: 'Last Updated',
    value: formatDateTime(vitals.timestamp || vitals.updated_at),
  },
];

const buildMedications = (detail = {}) => {
  const sources = [
    detail.medications,
    detail.current_medications,
    detail.treatment_plan,
    detail.treatments,
    detail.plan,
  ];

  const entries = sources.flatMap((source) =>
    asArray(source).map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return null;
      const name = valueOrFallback(item.name || item.medication || item.title, null);
      const dose = valueOrFallback(item.dose || item.dosage, null);
      const route = valueOrFallback(item.route, null);
      const frequency = valueOrFallback(item.frequency || item.schedule, null);
      const parts = [name, dose, route, frequency].filter(Boolean);
      return parts.length > 0 ? parts.join(' • ') : null;
    })
  ).filter(Boolean);

  return entries.length > 0 ? entries : ['Medication and treatment details are not currently available in the connected payload.'];
};

const buildNotes = (detail = {}, prediction = null, feedback = [], auditLog = []) => {
  const detailNotes = [
    ...asArray(detail.notes),
    ...asArray(detail.observations),
    ...asArray(detail.clinical_notes),
  ].map((item) => sentenceCase(item));

  const aiNote = prediction?.escalation?.message ? [`AI escalation: ${prediction.escalation.message}`] : [];
  const clinicianNotes = feedback
    .slice(0, 3)
    .map((entry) => `${entry.sentiment}: ${entry.note || 'No note provided.'}`);
  const recentAudit = auditLog
    .slice(0, 2)
    .map((entry) => `${entry.action} (${formatDateTime(entry.at)})`);

  const notes = [...detailNotes, ...aiNote, ...clinicianNotes, ...recentAudit].filter(Boolean);
  return notes.length > 0 ? notes : ['No additional notes or observations were available when this report was generated.'];
};

const buildTeam = (patient = {}, detail = {}) => {
  const department = valueOrFallback(detail.department || patient.department || 'Intensive Care Unit');
  const attending = valueOrFallback(detail.attending_physician || detail.attending_team || detail.primary_physician || patient.attending_team || 'ICU attending physician not specified');
  const nursing = valueOrFallback(detail.nursing_team || detail.nursing_unit || 'Bedside nursing team not specified');

  return {
    department,
    attending,
    nursing,
  };
};

const buildRiskIndicators = (patient = {}, prediction = null, relatedAlerts = []) => {
  const diagnosis = valueOrFallback(patient.diagnosis || patient.primary_diagnosis || 'Diagnosis not specified');
  const indicators = [
    `Primary diagnosis: ${diagnosis}`,
    `Current status: ${sentenceCase(patient.status || 'Unknown')}`,
  ];

  if (prediction?.risk) {
    indicators.push(`Model classification: ${valueOrFallback(prediction.risk.label || prediction.risk.classification)}`);
    indicators.push(`7-day mortality risk: ${formatPercent(prediction.risk.riskPercentage)}`);
    indicators.push(`Risk score: ${valueOrFallback(prediction.risk.overallScore, REPORT_PLACEHOLDER)}`);
  }

  relatedAlerts.slice(0, 3).forEach((alert) => {
    indicators.push(`Alert: ${valueOrFallback(alert.top_factor || alert.category || alert.severity)}`);
  });

  return indicators;
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderListHtml = (items = []) =>
  items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

export const generatePatientReport = ({
  patient = {},
  detail = {},
  vitalsHistory = [],
  prediction = null,
  predictionHistory = [],
  alerts = [],
  feedback = [],
  auditLog = [],
  generatedAt = new Date().toISOString(),
} = {}) => {
  const mergedPatient = { ...patient, ...(detail.patient || {}), ...detail };
  const relatedAlerts = alerts.filter((alert) => alert.patient_id === mergedPatient.patient_id);
  const relatedFeedback = feedback.filter((entry) => entry.patient_id === mergedPatient.patient_id);
  const relatedAudit = auditLog.filter((entry) => entry.patient_id === mergedPatient.patient_id);
  const currentVitals = latestVitalsSnapshot(mergedPatient, detail, vitalsHistory);
  const trend = summarizeTrend(predictionHistory);
  const team = buildTeam(mergedPatient, detail);
  const treatmentPlan = buildMedications(detail);
  const notes = buildNotes(detail, prediction, relatedFeedback, relatedAudit);
  const riskTone = getRiskTone(prediction?.risk?.riskPercentage || 0);
  const admissionDate = mergedPatient.admitted_at || detail.admitted_at || detail.admission_date;
  const reportTimestamp = formatDateTime(generatedAt);

  const lengthOfStayDays = (() => {
    if (!admissionDate) return REPORT_PLACEHOLDER;
    const diff = Date.now() - new Date(admissionDate).getTime();
    if (!Number.isFinite(diff) || diff < 0) return REPORT_PLACEHOLDER;
    return `${Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)))} days`;
  })();

  const highlights = [
    {
      label: 'Status',
      value: sentenceCase(mergedPatient.status || 'Unknown'),
      tone: riskTone,
    },
    {
      label: 'Bed / Unit',
      value: `${valueOrFallback(mergedPatient.bed_id)} • ${team.department}`,
      tone: 'stable',
    },
    {
      label: '7-Day Risk',
      value: prediction?.risk ? formatPercent(prediction.risk.riskPercentage) : REPORT_PLACEHOLDER,
      tone: riskTone,
    },
    {
      label: 'Trend',
      value: trend.direction === 'flat' ? 'Stable' : `${trend.direction === 'up' ? 'Rising' : 'Improving'} ${Math.abs(trend.delta)} pts`,
      tone: trend.direction === 'up' ? 'warning' : trend.direction === 'down' ? 'stable' : 'stable',
    },
  ];

  return {
    reportId: `report-${mergedPatient.patient_id || 'unknown'}-${Date.now()}`,
    generatedAt,
    generatedLabel: reportTimestamp,
    title: 'Patient Clinical Report',
    patientId: valueOrFallback(mergedPatient.patient_id),
    patientName: valueOrFallback(mergedPatient.name || detail.full_name || 'Unknown Patient'),
    tone: riskTone,
    highlights,
    patientInfo: [
      ['Patient ID', valueOrFallback(mergedPatient.patient_id)],
      ['Full Name', valueOrFallback(mergedPatient.name)],
      ['Age / Gender', `${valueOrFallback(mergedPatient.age, '–')} / ${valueOrFallback(sentenceCase(mergedPatient.gender), '–')}`],
      ['Bed Assignment', valueOrFallback(mergedPatient.bed_id)],
      ['Department', team.department],
      ['Report Generated', reportTimestamp],
    ],
    admissionDetails: [
      ['Admission Date', formatDate(admissionDate)],
      ['Length of Stay', lengthOfStayDays],
      ['Admission Source', valueOrFallback(detail.admission_source || 'Emergency / ICU intake')],
      ['Primary Diagnosis', valueOrFallback(mergedPatient.diagnosis)],
    ],
    currentCondition: {
      status: sentenceCase(mergedPatient.status || 'Unknown'),
      summary: prediction?.risk
        ? `${valueOrFallback(mergedPatient.name)} is currently categorized as ${valueOrFallback(prediction.risk.label || prediction.risk.classification)} with ${formatPercent(prediction.risk.riskPercentage)} estimated 7-day mortality risk.`
        : `${valueOrFallback(mergedPatient.name)} currently has no synchronized AI prediction available. The report uses the latest patient and vital sign data from the frontend state.`,
      escalation: valueOrFallback(prediction?.escalation?.message || 'Continue routine monitoring and multidisciplinary review.'),
    },
    vitalsSummary: buildVitalsMetrics(currentVitals),
    riskIndicators: buildRiskIndicators(mergedPatient, prediction, relatedAlerts),
    treatmentPlan,
    aiInsights: {
      model: valueOrFallback(prediction?.modelInfo?.model || prediction?.modelInfo?.modelType || 'Local clinical intelligence model'),
      confidence: prediction?.risk ? formatPercent(prediction.risk.confidence) : REPORT_PLACEHOLDER,
      recommendations: prediction?.recommendations?.length ? prediction.recommendations : ['No AI recommendations were available for this patient at the time of report generation.'],
      factors: prediction?.factors?.length ? prediction.factors : ['No contributing factors were returned by the model.'],
      alerts: relatedAlerts.length > 0
        ? relatedAlerts.map((alert) => `${valueOrFallback(alert.category, 'Alert')}: ${valueOrFallback(alert.top_factor || alert.severity)}`)
        : ['No active patient-specific alerts were available.'],
    },
    notes,
    attendingTeam: [
      ['Attending Physician / Team', team.attending],
      ['Nursing / Unit', team.nursing],
      ['Department', team.department],
    ],
  };
};

export const createPatientReportAssistantMessage = (report) => {
  if (!report) return 'I could not prepare the patient report.';
  return `Preparing a structured report for ${report.patientName} (${report.patientId}). The Patient Report workspace is ready for preview, PDF export, or printing.`;
};

export const createPatientReportRequestMessage = ({ patientId, patientName } = {}) =>
  `Preparing the patient report for ${patientName ? `${patientName} (${patientId})` : patientId}. Opening the Patient Report workspace now.`;

export const resolvePatientReportRequest = ({
  query,
  patients = [],
  preferredPatientId = null,
}) => {
  const normalized = String(query || '').trim().toLowerCase();
  const matched = REPORT_KEYWORDS.some((keyword) => normalized.includes(keyword));
  if (!matched) {
    return { matched: false, patientId: null, patient: null };
  }

  const patient = pickPatientFromQuery(query, patients, preferredPatientId);
  const extractedPatientId = extractPatientIdentifier(query);
  return {
    matched: true,
    patientId: patient?.patient_id || extractedPatientId || null,
    patient: patient || null,
  };
};

export const createPatientReportHtml = (report) => {
  const sectionRows = (rows) =>
    rows
      .map(
        ([label, value]) => `
          <div class="report-row">
            <div class="report-row-label">${escapeHtml(label)}</div>
            <div class="report-row-value">${escapeHtml(value)}</div>
          </div>`
      )
      .join('');

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(report.patientId)}-clinical-report</title>
      <style>
        :root {
          color-scheme: light;
          --report-bg: #f7fbff;
          --report-surface: #ffffff;
          --report-border: #d7e5f3;
          --report-text: #17344d;
          --report-muted: #5f768c;
          --report-accent: #2477e1;
          --report-accent-soft: #e7f1ff;
          --report-shadow: 0 18px 50px rgba(56, 106, 156, 0.12);
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 32px;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: var(--report-text);
          background: linear-gradient(180deg, #fbfdff 0%, var(--report-bg) 100%);
        }
        .report-doc {
          max-width: 1080px;
          margin: 0 auto;
          background: var(--report-surface);
          border: 1px solid var(--report-border);
          border-radius: 24px;
          box-shadow: var(--report-shadow);
          overflow: hidden;
        }
        .report-head {
          padding: 32px;
          background: linear-gradient(135deg, #ffffff 0%, #edf6ff 100%);
          border-bottom: 1px solid var(--report-border);
        }
        .report-kicker {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--report-accent);
          margin-bottom: 10px;
          font-weight: 700;
        }
        .report-title {
          margin: 0 0 10px;
          font-size: 36px;
          line-height: 1;
        }
        .report-subtitle {
          margin: 0;
          color: var(--report-muted);
          font-size: 16px;
        }
        .report-highlight-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          padding: 24px 32px 0;
        }
        .report-highlight {
          padding: 18px;
          border-radius: 18px;
          background: #f8fbff;
          border: 1px solid var(--report-border);
        }
        .report-highlight-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--report-muted);
          margin-bottom: 10px;
        }
        .report-highlight-value {
          font-size: 22px;
          font-weight: 700;
        }
        .report-body {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          padding: 24px 32px 32px;
        }
        .report-section {
          border: 1px solid var(--report-border);
          border-radius: 20px;
          padding: 20px;
          background: #fff;
        }
        .report-section.wide { grid-column: 1 / -1; }
        .report-section-title {
          margin: 0 0 16px;
          font-size: 16px;
          color: var(--report-accent);
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }
        .report-row {
          display: grid;
          grid-template-columns: 170px 1fr;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid #edf3f9;
        }
        .report-row:last-child { border-bottom: 0; }
        .report-row-label {
          color: var(--report-muted);
          font-size: 13px;
          font-weight: 600;
        }
        .report-row-value {
          font-size: 14px;
        }
        .report-list {
          margin: 0;
          padding-left: 20px;
          display: grid;
          gap: 10px;
          color: var(--report-text);
        }
        .report-summary {
          margin: 0;
          color: var(--report-text);
          line-height: 1.7;
        }
        @media print {
          body {
            background: #fff;
            padding: 0;
          }
          .report-doc {
            box-shadow: none;
            border-radius: 0;
            border: 0;
          }
        }
      </style>
    </head>
    <body>
      <article class="report-doc">
        <header class="report-head">
          <div class="report-kicker">ICU Digital Twin Patient Document</div>
          <h1 class="report-title">${escapeHtml(report.title)}</h1>
          <p class="report-subtitle">${escapeHtml(report.patientName)} • ${escapeHtml(report.patientId)} • ${escapeHtml(report.generatedLabel)}</p>
        </header>
        <section class="report-highlight-grid">
          ${report.highlights
            .map(
              (item) => `
              <div class="report-highlight">
                <div class="report-highlight-label">${escapeHtml(item.label)}</div>
                <div class="report-highlight-value">${escapeHtml(item.value)}</div>
              </div>`
            )
            .join('')}
        </section>
        <main class="report-body">
          <section class="report-section">
            <h2 class="report-section-title">Patient Information</h2>
            ${sectionRows(report.patientInfo)}
          </section>
          <section class="report-section">
            <h2 class="report-section-title">Admission Details</h2>
            ${sectionRows(report.admissionDetails)}
          </section>
          <section class="report-section wide">
            <h2 class="report-section-title">Current Condition / Status</h2>
            <p class="report-summary">${escapeHtml(report.currentCondition.summary)}</p>
            <div style="height: 12px;"></div>
            ${sectionRows([
              ['Current Status', report.currentCondition.status],
              ['Escalation Guidance', report.currentCondition.escalation],
            ])}
          </section>
          <section class="report-section">
            <h2 class="report-section-title">Vital Signs Summary</h2>
            ${sectionRows(report.vitalsSummary.map((metric) => [metric.label, metric.value]))}
          </section>
          <section class="report-section">
            <h2 class="report-section-title">Diagnoses / Risk Indicators</h2>
            <ul class="report-list">${renderListHtml(report.riskIndicators)}</ul>
          </section>
          <section class="report-section">
            <h2 class="report-section-title">Medications / Treatment Plan</h2>
            <ul class="report-list">${renderListHtml(report.treatmentPlan)}</ul>
          </section>
          <section class="report-section">
            <h2 class="report-section-title">AI Insights / Predictions / Recommendations</h2>
            ${sectionRows([
              ['AI Model', report.aiInsights.model],
              ['Confidence', report.aiInsights.confidence],
            ])}
            <ul class="report-list">${renderListHtml([
              ...report.aiInsights.factors,
              ...report.aiInsights.recommendations,
              ...report.aiInsights.alerts,
            ])}</ul>
          </section>
          <section class="report-section">
            <h2 class="report-section-title">Notes / Observations</h2>
            <ul class="report-list">${renderListHtml(report.notes)}</ul>
          </section>
          <section class="report-section wide">
            <h2 class="report-section-title">Attending Team / Department</h2>
            ${sectionRows(report.attendingTeam)}
          </section>
        </main>
      </article>
    </body>
  </html>`;
};

export const openPatientReportExport = (report, { autoPrint = false } = {}) => {
  if (typeof window === 'undefined' || !report) return null;
  const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
  if (!reportWindow) return null;

  reportWindow.document.open();
  reportWindow.document.write(createPatientReportHtml(report));
  reportWindow.document.close();
  reportWindow.focus();

  if (autoPrint) {
    reportWindow.onload = () => {
      reportWindow.print();
    };
  }

  return reportWindow;
};
