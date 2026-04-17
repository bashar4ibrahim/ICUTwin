import React from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { renderToStaticMarkup } from 'react-dom/server';
import { apiFetch as defaultApiFetch } from './api';
import {
  REPORT_PLACEHOLDER,
  createPatientReportRequestMessage,
  generatePatientReport as buildBasePatientReport,
  normalizePatientDetailPayload,
  normalizeVitalsHistoryPayload,
} from './patientReports';
import PatientReportDocument from '../components/PatientReportDocument';

const valueOrFallback = (value, fallback = REPORT_PLACEHOLDER) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  return value;
};

const pickFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === null || value === undefined || value === '') return [];
  return [value];
};

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatDateTime = (value) => {
  if (!value) return REPORT_PLACEHOLDER;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return REPORT_PLACEHOLDER;
  return date.toLocaleString();
};

const cleanText = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â|Ã¢â‚¬â€|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â”|â€”|â€“/g, '\u2013')
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢|Ã¢â‚¬Â¢|â€¢/g, ' \u2022 ')
    .replace(/ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢|Ã¢â€ â€™|â†’/g, '\u2192')
    .replace(/ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“|Ã¢Å“â€œ|âœ“/g, '\u2713')
    .replace(/Ãƒâ€šÃ‚Â°C|Ã‚Â°C|Â°C/g, '\u00B0C')
    .replace(/ÃƒÂ¢Ã¢â‚¬Å¡Ã¢â‚¬Å¡/g, '2')
    .replace(/Ãƒâ€šÃ‚Â·|Â·/g, ' \u2022 ')
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“|Ã¢â‚¬â€œ/g, '\u2013')
    .replace(/\\u2022/g, '•')
    .replace(/\\u2013/g, '–')
    .replace(/\\u2192/g, '→')
    .replace(/\\u2713/g, '✓')
    .replace(/\\u00B0/g, '°')
    .replace(/\s+/g, ' ')
    .trim();
};
const sanitizeRows = (rows = []) => rows.map(([label, value]) => [cleanText(label), cleanText(value)]);
const sanitizeList = (items = []) => items.map((item) => cleanText(item));
const sanitizeHighlights = (items = []) =>
  items.map((item) => ({
    ...item,
    label: cleanText(item.label),
    value: cleanText(item.value),
  }));

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

const getLosDays = (losPayload = null) =>
  toNumberOrNull(
    pickFirstDefined(
      losPayload?.predicted_los_days,
      losPayload?.length_of_stay_days,
      losPayload?.expected_los_days,
      losPayload?.predicted_days,
      losPayload?.days
    )
  );

const buildPredictionFromRiskPayload = (riskPayload = null, losPayload = null, existingPrediction = null) => {
  if (existingPrediction?.risk) {
    return {
      ...existingPrediction,
      aiInsightsLosDays: getLosDays(losPayload) ?? existingPrediction.aiInsightsLosDays ?? null,
    };
  }

  if (!riskPayload) return null;

  const riskAssessment = riskPayload.risk_assessment || {};
  const overallScore = toNumberOrNull(
    pickFirstDefined(
      riskAssessment.overall_score,
      riskAssessment.risk_score,
      riskPayload.risk_score,
      riskPayload.overall_score
    )
  );
  const sepsisProbability = toNumberOrNull(
    pickFirstDefined(riskAssessment.sepsis_probability, riskPayload.sepsis_probability)
  );
  const deteriorationProbability = toNumberOrNull(
    pickFirstDefined(riskAssessment.deterioration_probability, riskPayload.deterioration_probability)
  );
  const riskPercentage =
    toNumberOrNull(
      pickFirstDefined(
        riskAssessment.risk_percentage,
        riskPayload.risk_percentage,
        overallScore,
        deteriorationProbability,
        sepsisProbability
      )
    ) ?? 0;

  return {
    risk: {
      overallScore: overallScore ?? riskPercentage,
      riskPercentage,
      label: valueOrFallback(
        pickFirstDefined(
          riskAssessment.category,
          riskAssessment.risk_level,
          riskPayload.category,
          riskPayload.risk_level,
          riskPayload.classification
        ),
        'AI review pending'
      ),
      classification: valueOrFallback(
        pickFirstDefined(
          riskAssessment.category,
          riskAssessment.risk_level,
          riskPayload.category,
          riskPayload.risk_level,
          riskPayload.classification
        ),
        'AI review pending'
      ),
      confidence: toNumberOrNull(
        pickFirstDefined(
          riskAssessment.confidence,
          riskPayload.confidence,
          riskPayload.confidence_score,
          riskPayload.model_info?.confidence
        )
      ),
      sepsisProbability,
      deteriorationProbability,
    },
    modelInfo: {
      model: valueOrFallback(
        pickFirstDefined(riskPayload.model_info?.model, riskPayload.model, riskPayload.model_info?.model_type),
        'Connected ICU AI risk model'
      ),
      modelType: valueOrFallback(
        pickFirstDefined(riskPayload.model_info?.model_type, riskPayload.model_type),
        'Clinical risk classification'
      ),
    },
    factors: asArray(
      pickFirstDefined(riskPayload.contributing_factors, riskAssessment.contributing_factors, riskPayload.top_features)
    ),
    recommendations: asArray(
      pickFirstDefined(riskPayload.recommended_actions, riskAssessment.recommended_actions, riskPayload.recommendations)
    ),
    alerts: asArray(pickFirstDefined(riskPayload.clinical_alerts, riskPayload.alerts)),
    escalation: {
      message:
        riskPercentage >= 75
          ? 'Escalate to the attending ICU team and prioritize bedside reassessment.'
          : riskPercentage >= 45
            ? 'Repeat assessment and closely track trend changes.'
            : 'Continue routine monitoring and multidisciplinary review.',
    },
    aiInsightsLosDays: getLosDays(losPayload),
    generatedAt: new Date().toISOString(),
  };
};

const buildTimelineEvents = (report, mergedPatient, detail, vitalsHistory, relatedAlerts, generatedAt) => {
  const latestVitals = vitalsHistory[vitalsHistory.length - 1] || detail.latest_vitals || mergedPatient.latest_vitals || {};
  const admissionDate = mergedPatient.admitted_at || detail.admitted_at || detail.admission_date;
  const events = [];

  if (admissionDate) {
    events.push({
      label: 'ICU admission',
      timeLabel: formatDateTime(admissionDate),
      detail: `${valueOrFallback(mergedPatient.name || mergedPatient.patient_id)} admitted to ${valueOrFallback(mergedPatient.bed_id, 'bed pending')} with ${valueOrFallback(mergedPatient.diagnosis, 'diagnosis pending')}.`,
      tone: 'stable',
    });
  }

  if (latestVitals.timestamp || latestVitals.updated_at) {
    events.push({
      label: 'Latest vitals sync',
      timeLabel: formatDateTime(latestVitals.timestamp || latestVitals.updated_at),
      detail: `Most recent physiological data was synchronized into the report workspace.`,
      tone: 'stable',
    });
  }

  if (report.aiInsights?.classification && report.aiInsights.classification !== REPORT_PLACEHOLDER) {
    events.push({
      label: 'AI risk assessment',
      timeLabel: formatDateTime(generatedAt),
      detail: `${report.aiInsights.classification} with risk score ${report.aiInsights.riskScore} and estimate ${report.aiInsights.riskEstimate}.`,
      tone: report.tone || 'stable',
    });
  }

  relatedAlerts.slice(0, 3).forEach((alert) => {
    events.push({
      label: valueOrFallback(alert.category, 'Clinical alert'),
      timeLabel: formatDateTime(alert.generated_at || alert.created_at || generatedAt),
      detail: valueOrFallback(alert.top_factor || alert.severity, 'Review required'),
      tone: String(alert.severity || '').toUpperCase().includes('CRIT') ? 'critical' : 'warning',
    });
  });

  return events.length > 0
    ? events
    : [
        {
          label: 'Report generation',
          timeLabel: formatDateTime(generatedAt),
          detail: 'The report was generated from the latest available ICU data layers.',
          tone: 'stable',
        },
      ];
};

const enhanceReportModel = ({ baseReport, mergedPatient, detail, vitalsHistory, relatedAlerts, generatedAt }) => {
  const losDays = toNumberOrNull(baseReport.aiInsights?.expectedLos?.split(' ')[0]);
  const summary = cleanText(baseReport.currentCondition?.summary) || `${baseReport.patientName} is being summarized from current ICU data.`;

  return {
    ...baseReport,
    title: 'Patient Clinical Executive Summary',
    patientId: cleanText(baseReport.patientId),
    patientName: cleanText(baseReport.patientName),
    highlights: sanitizeHighlights([
      {
        label: 'Current Status',
        value: valueOrFallback(mergedPatient.status, 'Unknown'),
        tone: baseReport.tone || 'stable',
      },
      {
        label: 'Bed / Unit',
        value: `${valueOrFallback(mergedPatient.bed_id, 'Bed TBD')} / ${valueOrFallback(detail.unit || detail.icu_unit || 'Primary ICU')}`,
        tone: 'stable',
      },
      {
        label: 'AI Risk',
        value:
          baseReport.riskIndicators?.find((item) => String(item).startsWith('AI risk estimate:'))?.replace('AI risk estimate: ', '') ||
          REPORT_PLACEHOLDER,
        tone: baseReport.tone || 'stable',
      },
      {
        label: 'Expected LOS',
        value:
          baseReport.admissionDetails?.find(([label]) => label === 'Expected LOS')?.[1] ||
          (losDays !== null ? `${losDays} days` : REPORT_PLACEHOLDER),
        tone: losDays !== null && losDays >= 7 ? 'warning' : 'stable',
      },
    ]),
    patientInfo: sanitizeRows([
      ['Patient ID', mergedPatient.patient_id],
      ['Full Name', mergedPatient.name || detail.full_name || 'Unknown Patient'],
      ['Age / Gender', `${valueOrFallback(mergedPatient.age, '-')} / ${valueOrFallback(mergedPatient.gender, '-')}`],
      ['Room / Bed', mergedPatient.bed_id || 'Bed TBD'],
      ['ICU Unit', detail.unit || detail.icu_unit || 'Primary ICU'],
      ['Department', detail.department || 'Intensive Care Unit'],
    ]),
    admissionDetails: sanitizeRows([
      ...baseReport.admissionDetails,
      [
        'Expected LOS',
        baseReport.admissionDetails?.find(([label]) => label === 'Expected LOS')?.[1] ||
          (losDays !== null ? `${losDays} days` : REPORT_PLACEHOLDER),
      ],
    ]),
    vitalsSummary: sanitizeRows(baseReport.vitalsSummary.map((metric) => [metric.label, metric.value])).map(([label, value]) => ({
      label,
      value,
    })),
    riskIndicators: sanitizeList(baseReport.riskIndicators),
    treatmentPlan: sanitizeList(baseReport.treatmentPlan),
    notes: sanitizeList(baseReport.notes),
    attendingTeam: sanitizeRows(baseReport.attendingTeam),
    header: {
      systemName: 'ICU Digital Twin',
      systemSubtitle: 'AI-Augmented Clinical Executive Summary',
      department: cleanText(baseReport.attendingTeam?.find(([label]) => label === 'Department')?.[1]) || 'Intensive Care Unit',
      attending: cleanText(baseReport.attendingTeam?.find(([label]) => label === 'Attending Physician / Team')?.[1]) || 'Attending team not specified',
    },
    executiveSummary: {
      summary,
      status: cleanText(baseReport.currentCondition?.status) || valueOrFallback(mergedPatient.status, 'Unknown'),
      severity:
        cleanText(baseReport.aiInsights?.classification) ||
        cleanText(baseReport.highlights?.[0]?.value) ||
        REPORT_PLACEHOLDER,
      careFocus: cleanText(baseReport.currentCondition?.escalation) || 'Continue routine multidisciplinary review.',
      priorityNotes: [
        relatedAlerts.length > 0
          ? `${relatedAlerts.length} active patient-specific alerts require review.`
          : 'No active patient-specific alerts were found at generation time.',
        ...sanitizeList((baseReport.aiInsights?.recommendations || []).slice(0, 2)),
      ],
    },
    clinicalStatus: {
      summary: summary,
      rows: sanitizeRows([
        ['Current Status', baseReport.currentCondition?.status],
        ['Escalation Guidance', baseReport.currentCondition?.escalation],
        ['Latest Vitals Sync', formatDateTime((vitalsHistory[vitalsHistory.length - 1] || detail.latest_vitals || {}).timestamp || (vitalsHistory[vitalsHistory.length - 1] || detail.latest_vitals || {}).updated_at)],
        ['Primary Diagnosis', valueOrFallback(mergedPatient.diagnosis)],
      ]),
      observations: sanitizeList(baseReport.notes.slice(0, 3)),
    },
    aiInsights: {
      ...baseReport.aiInsights,
      model: cleanText(baseReport.aiInsights?.model),
      classification:
        cleanText(baseReport.aiInsights?.classification) ||
        cleanText(baseReport.riskIndicators?.find((item) => String(item).startsWith('AI classification:'))?.replace('AI classification: ', '')) ||
        REPORT_PLACEHOLDER,
      riskScore:
        cleanText(baseReport.riskIndicators?.find((item) => String(item).startsWith('AI risk score:'))?.replace('AI risk score: ', '')) ||
        REPORT_PLACEHOLDER,
      riskEstimate:
        cleanText(baseReport.riskIndicators?.find((item) => String(item).startsWith('AI risk estimate:'))?.replace('AI risk estimate: ', '')) ||
        REPORT_PLACEHOLDER,
      confidence: cleanText(baseReport.aiInsights?.confidence),
      expectedLos:
        cleanText(baseReport.admissionDetails?.find(([label]) => label === 'Expected LOS')?.[1]) ||
        (losDays !== null ? `${losDays} days` : REPORT_PLACEHOLDER),
      factors: sanitizeList(baseReport.aiInsights?.factors || []),
      recommendations: sanitizeList(baseReport.aiInsights?.recommendations || []),
      alerts: sanitizeList(baseReport.aiInsights?.alerts || []),
    },
    timelineEvents: buildTimelineEvents(baseReport, mergedPatient, detail, vitalsHistory, relatedAlerts, generatedAt).map((event) => ({
      ...event,
      label: cleanText(event.label),
      timeLabel: cleanText(event.timeLabel),
      detail: cleanText(event.detail),
    })),
    footer: {
      generatedBy: 'ICU Digital Twin Report Engine',
      generatedAt: cleanText(baseReport.generatedLabel),
      disclaimer:
        'This executive summary is generated from connected ICU APIs and synchronized clinical context. It supports review, presentation, and handoff readiness and does not replace clinician judgment.',
    },
  };
};

export async function generatePatientReportDocument({
  patientId,
  patient = null,
  patients = [],
  snapshots = {},
  predictions = {},
  predictionHistory = {},
  alerts = [],
  feedback = [],
  auditLog = [],
  apiClient = defaultApiFetch,
  generatedAt = new Date().toISOString(),
} = {}) {
  const resolvedPatientId = patientId || patient?.patient_id;
  if (!resolvedPatientId) throw new Error('A patient ID is required to generate the patient report.');

  const basePatient =
    patient ||
    patients.find((item) => item.patient_id === resolvedPatientId) ||
    snapshots?.[resolvedPatientId] ||
    { patient_id: resolvedPatientId };

  const alertsPromise = alerts.length > 0 ? Promise.resolve({ alerts }) : apiClient('/icu/ai/alerts');
  const [detailResult, vitalsResult, riskResult, losResult, alertsResult] = await Promise.allSettled([
    apiClient(`/icu/patients/${resolvedPatientId}`),
    apiClient(`/icu/vitals/${resolvedPatientId}/history?limit=24`),
    apiClient(`/icu/ai/risk/${resolvedPatientId}`),
    apiClient(`/icu/ai/predict/los/${resolvedPatientId}`),
    alertsPromise,
  ]);

  const detail = detailResult.status === 'fulfilled' ? normalizePatientDetailPayload(detailResult.value) : {};
  const vitalsHistory = vitalsResult.status === 'fulfilled' ? normalizeVitalsHistoryPayload(vitalsResult.value) : [];
  const mergedPatient = {
    ...basePatient,
    ...detail,
    latest_vitals: detail.latest_vitals || basePatient.latest_vitals || vitalsHistory[vitalsHistory.length - 1] || {},
  };
  const riskPayload = riskResult.status === 'fulfilled' ? riskResult.value : null;
  const losPayload = losResult.status === 'fulfilled' ? normalizeLosPayload(losResult.value) : null;
  const allAlerts = alertsResult.status === 'fulfilled' ? normalizeAiAlertsPayload(alertsResult.value) : alerts;
  const prediction = buildPredictionFromRiskPayload(riskPayload, losPayload, predictions?.[resolvedPatientId] || null);
  const relatedAlerts = allAlerts.filter((alert) => alert.patient_id === resolvedPatientId);

  const baseReport = buildBasePatientReport({
    patient: mergedPatient,
    detail,
    vitalsHistory,
    prediction,
    predictionHistory: predictionHistory?.[resolvedPatientId] || [],
    alerts: allAlerts,
    feedback,
    auditLog,
    generatedAt,
  });

  const report = enhanceReportModel({
    baseReport,
    mergedPatient,
    detail,
    vitalsHistory,
    relatedAlerts,
    generatedAt,
  });

  return {
    report,
    mergedPatient,
    detail,
    vitalsHistory,
    prediction,
    assistantMessage: createPatientReportRequestMessage({
      patientId: report.patientId,
      patientName: report.patientName,
    }),
  };
}

const REPORT_EXPORT_CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #15324a;
    background: linear-gradient(180deg, #f7fbff 0%, #eef5fb 100%);
  }
  .report-preview-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .report-preview-toolbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid #d7e5f3;
    background: rgba(251, 253, 255, 0.94);
    backdrop-filter: blur(12px);
  }
  .report-preview-toolbar-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .report-preview-toolbar-eyebrow,
  .patient-report-kicker,
  .patient-report-issued-kicker,
  .patient-report-section-title,
  .patient-report-row-label,
  .patient-report-highlight-label,
  .patient-report-subheading,
  .patient-report-timeline-time,
  .patient-report-summary-metric span {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .report-preview-toolbar-eyebrow,
  .patient-report-kicker,
  .patient-report-issued-kicker,
  .patient-report-section-title,
  .patient-report-inline-badge,
  .patient-report-status-badge {
    color: #2477e1;
  }
  .report-preview-toolbar-title {
    font-size: 15px;
    font-weight: 700;
    color: #15324a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .report-preview-toolbar-note {
    font-size: 12px;
    color: #61768d;
  }
  .report-preview-toolbar-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
  }
  .report-preview-btn {
    appearance: none;
    border: 1px solid #d7e5f3;
    border-radius: 999px;
    padding: 10px 14px;
    background: #ffffff;
    color: #15324a;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(36, 119, 225, 0.08);
  }
  .report-preview-btn-primary {
    background: #2477e1;
    border-color: #2477e1;
    color: #ffffff;
  }
  .report-preview-body {
    padding: 24px 24px 40px;
  }
  .patient-report-export-host {
    width: 1040px;
    max-width: 100%;
    margin: 0 auto;
  }
  .patient-report-document {
    padding: 0;
    background: transparent;
    border: 0;
    box-shadow: none;
  }
  .patient-report-sheet {
    max-width: 1040px;
    margin: 0 auto;
    padding: 32px;
    border: 1px solid #d7e5f3;
    border-radius: 28px;
    background: #ffffff;
    box-shadow: 0 20px 54px rgba(47, 92, 141, 0.12);
  }
  .patient-report-export-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .patient-report-masthead,
  .patient-report-summary-band,
  .patient-report-section,
  .patient-report-highlight,
  .patient-report-issued,
  .patient-report-summary-metric,
  .patient-report-ai-list-card,
  .patient-report-timeline-item {
    border: 1px solid #dbe8f3;
    border-radius: 22px;
    background: linear-gradient(180deg, #ffffff 0%, #f9fcff 100%);
  }
  .patient-report-masthead,
  .patient-report-summary-band,
  .patient-report-section,
  .patient-report-issued,
  .patient-report-ai-list-card {
    padding: 24px;
  }
  .patient-report-masthead {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) 320px;
    gap: 24px;
    margin-bottom: 20px;
  }
  .patient-report-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .patient-report-kicker-divider {
    color: #9fb4c8;
    font-size: 12px;
  }
  .patient-report-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 14px;
  }
  .patient-report-title {
    margin: 0;
    font-size: 34px;
    line-height: 1;
    letter-spacing: -0.04em;
    color: #15324a;
  }
  .patient-report-status-badge,
  .patient-report-inline-badge {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: 1px solid rgba(36, 119, 225, 0.16);
    background: rgba(36, 119, 225, 0.08);
  }
  .patient-report-status-badge.tone-critical,
  .patient-report-inline-badge.tone-critical,
  .patient-report-status-badge.tone-alert,
  .patient-report-inline-badge.tone-alert {
    color: #c2354e;
    border-color: rgba(194, 53, 78, 0.18);
    background: rgba(194, 53, 78, 0.08);
  }
  .patient-report-status-badge.tone-warning,
  .patient-report-inline-badge.tone-warning {
    color: #b77912;
    border-color: rgba(183, 121, 18, 0.18);
    background: rgba(245, 158, 11, 0.1);
  }
  .patient-report-subtitle {
    margin: 10px 0 0;
    font-size: 15px;
    color: #61768d;
  }
  .patient-report-lead,
  .patient-report-summary,
  .patient-report-row-value,
  .patient-report-timeline-detail,
  .patient-report-footer span {
    line-height: 1.75;
    color: #15324a;
  }
  .patient-report-lead {
    margin: 18px 0 0;
    font-size: 15px;
    color: #3f5f79;
  }
  .patient-report-issued {
    display: grid;
    gap: 16px;
    background: linear-gradient(180deg, #fbfdff 0%, #f5faff 100%);
  }
  .patient-report-issued-title {
    display: block;
    margin-top: 8px;
    font-size: 18px;
    color: #15324a;
  }
  .patient-report-rows.is-compact .patient-report-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .patient-report-summary-band {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) 320px;
    gap: 18px;
    margin-bottom: 20px;
    background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  }
  .patient-report-summary-rail {
    display: grid;
    gap: 12px;
  }
  .patient-report-summary-metric {
    padding: 16px 18px;
  }
  .patient-report-summary-metric strong {
    display: block;
    margin-top: 8px;
    font-size: 20px;
    line-height: 1.2;
    color: #15324a;
  }
  .patient-report-priority-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
  }
  .patient-report-priority-chip {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    background: #eaf2ff;
    border: 1px solid rgba(36, 119, 225, 0.14);
    color: #2477e1;
    font-size: 12px;
    font-weight: 700;
  }
  .patient-report-highlights {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }
  .patient-report-highlight {
    padding: 18px;
  }
  .patient-report-highlight-value {
    margin-top: 10px;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.15;
    color: #15324a;
  }
  .patient-report-highlight.tone-critical,
  .patient-report-highlight.tone-alert {
    border-color: rgba(194, 53, 78, 0.18);
    background: linear-gradient(180deg, #ffffff 0%, #fff5f7 100%);
  }
  .patient-report-highlight.tone-warning {
    border-color: rgba(183, 121, 18, 0.18);
    background: linear-gradient(180deg, #ffffff 0%, #fff9ef 100%);
  }
  .patient-report-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .patient-report-document.is-export .patient-report-grid {
    grid-template-columns: 1fr;
  }
  .patient-report-section.is-wide {
    grid-column: 1 / -1;
  }
  .patient-report-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }
  .patient-report-row {
    display: grid;
    grid-template-columns: 176px minmax(0, 1fr);
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px solid #edf3f9;
  }
  .patient-report-row:last-child {
    border-bottom: 0;
  }
  .patient-report-row-label,
  .patient-report-highlight-label,
  .patient-report-subheading,
  .patient-report-timeline-time,
  .patient-report-summary-metric span {
    color: #61768d;
  }
  .patient-report-list {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 10px;
  }
  .patient-report-ai-section {
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  }
  .patient-report-ai-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    gap: 16px;
  }
  .patient-report-document.is-export .patient-report-ai-grid {
    grid-template-columns: 1fr;
  }
  .patient-report-ai-lists {
    display: grid;
    gap: 12px;
  }
  .patient-report-subheading {
    margin: 0 0 10px;
  }
  .patient-report-timeline {
    display: grid;
    gap: 12px;
  }
  .patient-report-timeline-item {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 16px;
    padding: 18px;
    background: #f9fcff;
  }
  .patient-report-timeline-item.tone-warning {
    border-color: rgba(183, 121, 18, 0.18);
  }
  .patient-report-timeline-item.tone-critical {
    border-color: rgba(194, 53, 78, 0.18);
  }
  .patient-report-timeline-label {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .patient-report-footer {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 24px;
    margin-top: 22px;
    padding-top: 20px;
    border-top: 1px solid #e4edf5;
  }
  .patient-report-footer strong {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: #15324a;
  }
  @media (max-width: 960px) {
    .report-preview-toolbar,
    .report-preview-toolbar-actions,
    .patient-report-masthead,
    .patient-report-summary-band,
    .patient-report-highlights,
    .patient-report-grid,
    .patient-report-ai-grid,
    .patient-report-footer,
    .patient-report-row,
    .patient-report-timeline-item {
      grid-template-columns: 1fr;
    }
    .report-preview-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }
    .report-preview-body {
      padding: 16px 16px 32px;
    }
    .patient-report-sheet {
      padding: 20px;
    }
    .patient-report-highlights {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @page {
    size: A4;
    margin: 12mm;
  }
  @media print {
    body {
      background: #ffffff;
    }
    .report-preview-toolbar {
      display: none !important;
    }
    .report-preview-body {
      padding: 0;
    }
    .patient-report-sheet {
      box-shadow: none;
      border: 0;
      border-radius: 0;
      padding: 0;
    }
  }
`;

const renderPatientReportMarkup = (report, assistantCopy = '', mode = 'preview') =>
  renderToStaticMarkup(
    React.createElement(PatientReportDocument, {
      report,
      assistantCopy,
      mode,
    })
  );

const buildReportFilename = (report) => {
  const patientId = String(report?.patientId || 'patient').replace(/[^a-z0-9_-]+/gi, '-');
  const datePart = new Date(report?.generatedAt || Date.now()).toISOString().slice(0, 10);
  return `ICU-Executive-Report-${patientId}-${datePart}.pdf`;
};

const createTemporaryExportMount = (report, assistantCopy = '') => {
  const mount = document.createElement('div');
  mount.setAttribute('aria-hidden', 'true');
  mount.style.position = 'fixed';
  mount.style.left = '-20000px';
  mount.style.top = '0';
  mount.style.width = '1100px';
  mount.style.pointerEvents = 'none';
  mount.style.opacity = '0';
  mount.style.zIndex = '-1';
  mount.innerHTML = `
    <style>${REPORT_EXPORT_CSS}</style>
    <div class="report-preview-shell">
      <div class="report-preview-body">
        <div class="patient-report-export-host">
          ${renderPatientReportMarkup(report, assistantCopy, 'export')}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(mount);
  return mount;
};

const waitForPaint = () =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });

export function createPatientReportHtml(report, assistantCopy = '') {
  const markup = renderPatientReportMarkup(report, assistantCopy, 'export');
  const title = `${report.patientId} clinical executive summary`;
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title><style>${REPORT_EXPORT_CSS}</style></head><body><div class="report-preview-shell"><div class="report-preview-toolbar"><div class="report-preview-toolbar-copy"><div class="report-preview-toolbar-eyebrow">Patient Report Preview</div><div class="report-preview-toolbar-title">${report.patientName} - ${report.patientId}</div><div class="report-preview-toolbar-note">Executive summary layout ready for print or PDF save.</div></div><div class="report-preview-toolbar-actions"><button class="report-preview-btn report-preview-btn-primary" onclick="window.print()">Print or Save PDF</button><button class="report-preview-btn" onclick="window.close()">Close</button></div></div><div class="report-preview-body"><div class="patient-report-export-host">${markup}</div></div></div></body></html>`;
}

const printPatientReportInHiddenFrame = (report, assistantCopy = '') => {
  if (typeof window === 'undefined' || !report) return null;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 500);
  };

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    cleanup();
    return null;
  }

  iframe.onload = () => {
    const handleAfterPrint = () => {
      frameWindow.removeEventListener('afterprint', handleAfterPrint);
      cleanup();
    };

    frameWindow.addEventListener('afterprint', handleAfterPrint);
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 4000);
  };

  frameWindow.document.open();
  frameWindow.document.write(createPatientReportHtml(report, assistantCopy));
  frameWindow.document.close();

  return iframe;
};

const downloadPatientReportPdf = async (report, assistantCopy = '') => {
  if (typeof window === 'undefined' || !report) return false;

  const mount = createTemporaryExportMount(report, assistantCopy);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    await waitForPaint();

    const host = mount.querySelector('.patient-report-export-host');
    if (!host) throw new Error('Patient report export host is unavailable.');

    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#eef5fb',
      logging: false,
      windowWidth: 1100,
      scrollX: 0,
      scrollY: 0,
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const imageHeight = (canvas.height * usableWidth) / canvas.width;
    const imageData = canvas.toDataURL('image/png', 1);

    let remainingHeight = imageHeight;
    let imageOffset = margin;

    doc.addImage(imageData, 'PNG', margin, imageOffset, usableWidth, imageHeight, undefined, 'FAST');
    remainingHeight -= usableHeight;

    while (remainingHeight > 0) {
      imageOffset = margin - (imageHeight - remainingHeight);
      doc.addPage();
      doc.addImage(imageData, 'PNG', margin, imageOffset, usableWidth, imageHeight, undefined, 'FAST');
      remainingHeight -= usableHeight;
    }

    doc.save(buildReportFilename(report));

    return true;
  } catch (error) {
    console.error('Unable to export patient report PDF:', error);
    return false;
  } finally {
    if (mount.parentNode) mount.parentNode.removeChild(mount);
  }
};

export const openPatientReportPreview = (report, assistantCopy = '') => ({
  report,
  assistantCopy,
});

export const exportPatientReportPdf = (report, assistantCopy = '') =>
  downloadPatientReportPdf(report, assistantCopy);

export const printPatientReport = (report, assistantCopy = '') =>
  printPatientReportInHiddenFrame(report, assistantCopy);

