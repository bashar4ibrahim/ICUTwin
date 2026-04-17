import React from 'react';

const INLINE_SEPARATOR = '\u2022';

const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const renderRows = (rows = [], options = {}) => {
  const { compact = false } = options;
  return (
    <div className={`patient-report-rows${compact ? ' is-compact' : ''}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="patient-report-row">
          <div className="patient-report-row-label">{label}</div>
          <div className="patient-report-row-value">{value}</div>
        </div>
      ))}
    </div>
  );
};

const renderList = (items = [], className = '') => (
  <ul className={`patient-report-list${className ? ` ${className}` : ''}`}>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const toneLabel = (tone) => {
  if (tone === 'critical' || tone === 'alert') return 'High Priority';
  if (tone === 'warning') return 'Moderate Priority';
  return 'Routine Review';
};

export default function PatientReportDocument({ report, assistantCopy = '', mode = 'preview' }) {
  if (!report) return null;

  const priorityNotes = asArray(report.executiveSummary?.priorityNotes);
  const highlightItems = asArray(report.highlights);
  const aiFactors = asArray(report.aiInsights?.factors);
  const aiRecommendations = asArray(report.aiInsights?.recommendations);
  const aiAlerts = asArray(report.aiInsights?.alerts);
  const summaryMetrics = [
    ['Current Status', report.executiveSummary?.status],
    ['Risk Classification', report.aiInsights?.classification || report.executiveSummary?.severity],
    ['Risk Score', report.aiInsights?.riskScore],
    ['Risk Estimate', report.aiInsights?.riskEstimate],
    ['Confidence', report.aiInsights?.confidence],
    ['Expected LOS', report.aiInsights?.expectedLos],
  ].filter(([, value]) => value && value !== 'Not available');

  return (
    <article className={`patient-report-document${mode === 'export' ? ' is-export' : ''}`}>
      <div className="patient-report-sheet">
        <header className="patient-report-masthead patient-report-export-block">
          <div className="patient-report-masthead-copy">
            <div className="patient-report-kicker">
              <span>{report.header?.systemName || 'ICU Digital Twin'}</span>
              <span className="patient-report-kicker-divider">{INLINE_SEPARATOR}</span>
              <span>{report.header?.systemSubtitle || 'Clinical Documentation'}</span>
            </div>

            <div className="patient-report-title-row">
              <h1 className="patient-report-title">{report.title}</h1>
              <span className={`patient-report-status-badge tone-${report.tone || 'stable'}`}>
                {toneLabel(report.tone)}
              </span>
            </div>

            <p className="patient-report-subtitle">
              {report.patientName} {INLINE_SEPARATOR} {report.patientId}
            </p>

            <p className="patient-report-lead">
              {report.executiveSummary?.summary || 'A structured ICU patient summary is available for review.'}
            </p>
          </div>

          <aside className="patient-report-issued">
            <div className="patient-report-issued-header">
              <span className="patient-report-issued-kicker">Report Metadata</span>
              <strong className="patient-report-issued-title">Clinical Executive Summary</strong>
            </div>
            {renderRows(
              [
                ['Generated', report.generatedLabel],
                ['Department', report.header?.department],
                ['Attending Team', report.header?.attending],
                ['Assistant Workflow', assistantCopy || 'Patient Report workspace available'],
              ],
              { compact: true }
            )}
          </aside>
        </header>

        <section className="patient-report-summary-band patient-report-export-block">
          <div className="patient-report-summary-main">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Executive Summary</h2>
            </div>
            <p className="patient-report-summary">
              {report.executiveSummary?.careFocus || 'Clinical review focus was not provided.'}
            </p>

            {priorityNotes.length > 0 && (
              <div className="patient-report-priority-list">
                {priorityNotes.map((item) => (
                  <span key={item} className="patient-report-priority-chip">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          <aside className="patient-report-summary-rail">
            {summaryMetrics.map(([label, value]) => (
              <div key={label} className="patient-report-summary-metric">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </aside>
        </section>

        <section className="patient-report-highlights patient-report-export-block">
          {highlightItems.map((item) => (
            <div key={item.label} className={`patient-report-highlight tone-${item.tone || 'stable'}`}>
              <div className="patient-report-highlight-label">{item.label}</div>
              <div className="patient-report-highlight-value">{item.value}</div>
            </div>
          ))}
        </section>

        <section className="patient-report-grid">
          <section className="patient-report-section patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Patient Information</h2>
            </div>
            {renderRows(report.patientInfo)}
          </section>

          <section className="patient-report-section patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Admission Details</h2>
            </div>
            {renderRows(report.admissionDetails)}
          </section>

          <section className="patient-report-section is-wide patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Clinical Status</h2>
            </div>
            <p className="patient-report-summary">{report.clinicalStatus?.summary}</p>
            {renderRows(report.clinicalStatus?.rows || [])}
            <h3 className="patient-report-subheading">Major Observations</h3>
            {renderList(report.clinicalStatus?.observations || [])}
          </section>

          <section className="patient-report-section patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Vital Signs Summary</h2>
            </div>
            {renderRows((report.vitalsSummary || []).map((metric) => [metric.label, metric.value]))}
          </section>

          <section className="patient-report-section patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Diagnoses and Risk Indicators</h2>
            </div>
            {renderList(report.riskIndicators || [])}
          </section>

          <section className="patient-report-section is-wide patient-report-ai-section patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Risk and AI Insights</h2>
              <span className={`patient-report-inline-badge tone-${report.tone || 'stable'}`}>
                {report.aiInsights?.classification || 'AI summary'}
              </span>
            </div>

            <div className="patient-report-ai-grid">
              <div className="patient-report-ai-metrics">
                {renderRows([
                  ['AI Model', report.aiInsights?.model],
                  ['Classification', report.aiInsights?.classification],
                  ['Risk Score', report.aiInsights?.riskScore],
                  ['Risk Estimate', report.aiInsights?.riskEstimate],
                  ['Confidence', report.aiInsights?.confidence],
                  ['Expected LOS', report.aiInsights?.expectedLos],
                ])}
              </div>

              <div className="patient-report-ai-lists">
                <div className="patient-report-ai-list-card">
                  <h3 className="patient-report-subheading">Contributing Factors</h3>
                  {renderList(aiFactors)}
                </div>
                <div className="patient-report-ai-list-card">
                  <h3 className="patient-report-subheading">Recommendations</h3>
                  {renderList(aiRecommendations)}
                </div>
                <div className="patient-report-ai-list-card">
                  <h3 className="patient-report-subheading">Active Alerts</h3>
                  {renderList(aiAlerts)}
                </div>
              </div>
            </div>
          </section>

          <section className="patient-report-section patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Treatment and Care Plan</h2>
            </div>
            {renderList(report.treatmentPlan || [])}
          </section>

          <section className="patient-report-section patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Attending Team and Department</h2>
            </div>
            {renderRows(report.attendingTeam)}
          </section>

          <section className="patient-report-section is-wide patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Timeline and Events Summary</h2>
            </div>
            <div className="patient-report-timeline">
              {asArray(report.timelineEvents).map((event) => (
                <div
                  key={`${event.label}-${event.timeLabel}`}
                  className={`patient-report-timeline-item tone-${event.tone || 'stable'}`}
                >
                  <div className="patient-report-timeline-time">{event.timeLabel}</div>
                  <div>
                    <div className="patient-report-timeline-label">{event.label}</div>
                    <div className="patient-report-timeline-detail">{event.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="patient-report-section patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Notes and Observations</h2>
            </div>
            {renderList(report.notes || [])}
          </section>

          <section className="patient-report-section patient-report-export-block">
            <div className="patient-report-section-header">
              <h2 className="patient-report-section-title">Document Footer Note</h2>
            </div>
            {renderRows([
              ['Generated By', report.footer?.generatedBy],
              ['Generated At', report.footer?.generatedAt],
              ['Clinical Note', report.footer?.disclaimer],
            ])}
          </section>
        </section>

        <footer className="patient-report-footer patient-report-export-block">
          <div>
            <strong>{report.footer?.generatedBy}</strong>
            <span>{report.footer?.generatedAt}</span>
          </div>
          <div>
            <strong>Clinical note</strong>
            <span>{report.footer?.disclaimer}</span>
          </div>
        </footer>
      </div>
    </article>
  );
}
