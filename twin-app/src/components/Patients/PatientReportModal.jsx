// PatientReportModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PatientReportModal.css';
import RiskBadge from './RiskBadge';
import ExportMenu from './ExportMenu';
import ReportSection, { ReportRow, AlertChip } from './ReportSection';

// ─────────────────────────────────────────────
// Report Generator Logic
// ─────────────────────────────────────────────

function getRiskLevel(score) {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function getTrend(values = []) {
  if (values.length < 2) return 'stable';
  const first = values[0];
  const last = values[values.length - 1];
  const diff = last - first;
  if (diff > first * 0.05) return 'worsening';
  if (diff < -first * 0.05) return 'improving';
  return 'stable';
}

function generateClinicalText(patient, vitals, prediction) {
  const lines = [];
  const riskScore = prediction?.risk?.riskPercentage ?? 0;
  const riskLevel = getRiskLevel(riskScore);
  const name = patient?.name || 'The patient';

  lines.push(
    `${name} is a ${patient?.age ?? '?'}-year-old ${patient?.gender ?? 'patient'} admitted with ${patient?.diagnosis || 'an unspecified condition'}.`
  );

  // Hemodynamic
  const hr = vitals?.heart_rate;
  const sysBP = vitals?.blood_pressure_sys;
  const diaBP = vitals?.blood_pressure_dia;
  if (hr > 110) lines.push(`Tachycardia is noted with heart rate at ${hr} bpm, indicating possible hemodynamic stress.`);
  else if (hr < 50) lines.push(`Bradycardia observed with heart rate at ${hr} bpm — requires immediate clinical assessment.`);
  else if (hr) lines.push(`Cardiovascular status shows heart rate of ${hr} bpm within acceptable range.`);

  if (sysBP && diaBP) {
    if (sysBP > 160) lines.push(`Blood pressure is elevated at ${sysBP}/${diaBP} mmHg. Hypertensive management may be indicated.`);
    else if (sysBP < 90) lines.push(`Hypotension detected: ${sysBP}/${diaBP} mmHg. Hemodynamic instability is a concern — IV fluids and vasopressor support should be evaluated.`);
    else lines.push(`Blood pressure is ${sysBP}/${diaBP} mmHg, within hemodynamically stable parameters.`);
  }

  // Respiratory
  const spo2 = vitals?.spo2;
  const rr = vitals?.respiratory_rate;
  if (spo2 < 90) lines.push(`Critical hypoxemia: SpO₂ at ${spo2}%. Immediate respiratory intervention is required.`);
  else if (spo2 < 94) lines.push(`Borderline oxygenation: SpO₂ at ${spo2}% — supplemental oxygen therapy should be reviewed.`);
  else if (spo2) lines.push(`Oxygen saturation is ${spo2}%, acceptable for current clinical status.`);

  if (rr > 25) lines.push(`Tachypnea present with respiratory rate of ${rr}/min, suggesting possible respiratory distress.`);

  // Combined concern
  if (spo2 < 92 && rr > 22) {
    lines.push('⚠ Combined low SpO₂ and elevated respiratory rate suggest respiratory decompensation risk.');
  }

  // Risk summary
  if (riskLevel === 'critical') lines.push(`Overall clinical risk is classified as CRITICAL (${riskScore}%). Immediate intensivist review is warranted.`);
  else if (riskLevel === 'high') lines.push(`Risk classification is HIGH (${riskScore}%). Close monitoring and proactive intervention planning are recommended.`);
  else lines.push(`Current 7-day deterioration risk is ${riskScore}%. Routine monitoring protocol should continue.`);

  if (prediction?.recommendation) lines.push(`AI Recommendation: ${prediction.recommendation}`);

  return lines;
}

function generateHandoverNotes(patient, vitals, prediction) {
  const riskScore = prediction?.risk?.riskPercentage ?? 0;
  const level = getRiskLevel(riskScore);
  return [
    `Patient ${patient?.name} (${patient?.patient_id}) in Bed ${patient?.bed_id} — ${level.toUpperCase()} risk.`,
    `Diagnosis: ${patient?.diagnosis || 'Not specified'}.`,
    `Latest vitals: HR ${vitals?.heart_rate ?? '--'} | BP ${vitals?.blood_pressure_sys ?? '--'}/${vitals?.blood_pressure_dia ?? '--'} | SpO₂ ${vitals?.spo2 ?? '--'}% | RR ${vitals?.respiratory_rate ?? '--'} | Temp ${vitals?.temperature ?? '--'}°C.`,
    prediction?.top_factor ? `Key clinical factor: ${prediction.top_factor}.` : null,
    `Continue monitoring and follow escalation protocol if deterioration occurs.`,
  ].filter(Boolean);
}

function generateExecutiveSummary(patient, vitals, prediction) {
  const riskScore = prediction?.risk?.riskPercentage ?? 0;
  const level = getRiskLevel(riskScore);
  const urgency =
    level === 'critical' ? 'requires immediate clinical attention' :
    level === 'high' ? 'warrants increased monitoring frequency' :
    'is currently under standard monitoring protocol';
  return `${patient?.name ?? 'Patient'} (${patient?.age ?? '?'}y, ${patient?.diagnosis ?? 'unspecified condition'}) has a 7-day deterioration risk of ${riskScore}% — classified as ${level.toUpperCase()}. The patient ${urgency}. Key vitals indicate ${vitals?.spo2 >= 94 ? 'stable' : 'compromised'} oxygenation and ${vitals?.heart_rate < 100 ? 'normal' : 'elevated'} cardiac output. AI analysis identifies ${prediction?.top_factor ?? 'no single dominant risk factor'} as the primary contributing variable. Clinical team should ${prediction?.recommendation ?? 'continue current monitoring plan'}.`;
}

// ─────────────────────────────────────────────
// Loading Steps
// ─────────────────────────────────────────────
const LOADING_STEPS = [
  { id: 1, text: 'Analyzing vitals...', icon: '💓' },
  { id: 2, text: 'Reviewing trends...', icon: '📈' },
  { id: 3, text: 'Assessing risk factors...', icon: '🧠' },
  { id: 4, text: 'Generating patient summary...', icon: '📋' },
];

// ─────────────────────────────────────────────
// Vitals Mini Card
// ─────────────────────────────────────────────
function VitalMiniCard({ label, value, unit, trend, warning }) {
  const trendColor = trend === 'improving' ? '#22c55e' : trend === 'worsening' ? '#ef4444' : '#94a3b8';
  const trendArrow = trend === 'improving' ? '↑' : trend === 'worsening' ? '↓' : '→';
  return (
    <div className={`vm-card ${warning ? 'vm-card--warn' : ''}`}>
      <div className="vm-label">{label}</div>
      <div className="vm-value">{value ?? '—'}<span className="vm-unit">{unit}</span></div>
      <div className="vm-trend" style={{ color: trendColor }}>{trendArrow} {trend}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────
export default function PatientReportModal({
  patient,
  vitalsHistory = [],
  prediction,
  onClose,
}) {
  const [reportMode, setReportMode] = useState('clinical'); // 'clinical' | 'executive' | 'handover'
  const [loadingStep, setLoadingStep] = useState(0); // 0 = not started, 1-4 = steps, 5 = done
  const [generatedAt, setGeneratedAt] = useState(null);
  const [key, setKey] = useState(0); // for re-generation
  const reportRef = useRef(null);
  const printRef = useRef(null);

  // Run loading sequence on mount and on regenerate
  const runGeneration = useCallback(() => {
    setLoadingStep(1);
    setGeneratedAt(null);
    const timings = [700, 600, 700, 600];
    let step = 1;
    const next = () => {
      step++;
      if (step <= 4) {
        setTimeout(() => { setLoadingStep(step); next(); }, timings[step - 1]);
      } else {
        setTimeout(() => {
          setLoadingStep(5);
          setGeneratedAt(new Date());
        }, 500);
      }
    };
    setTimeout(next, timings[0]);
  }, []);

  useEffect(() => {
    runGeneration();
  }, [key, runGeneration]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const vitals = patient?.latest_vitals || {};
  const riskScore = prediction?.risk?.riskPercentage ?? 0;
  const riskLevel = getRiskLevel(riskScore);

  // Trends
  const hrTrend   = getTrend(vitalsHistory.slice(-8).map(v => v.heart_rate).filter(Boolean));
  const spo2Trend = getTrend(vitalsHistory.slice(-8).map(v => v.spo2).filter(Boolean));
  const bpTrend   = getTrend(vitalsHistory.slice(-8).map(v => v.blood_pressure_sys).filter(Boolean));
  const rrTrend   = getTrend(vitalsHistory.slice(-8).map(v => v.respiratory_rate).filter(Boolean));

  // Alert flags
  const alerts = [];
  if (vitals.spo2 < 90) alerts.push({ label: 'Critical Hypoxemia', severity: 'danger' });
  else if (vitals.spo2 < 94) alerts.push({ label: 'Low SpO₂', severity: 'warning' });
  if (vitals.heart_rate > 110) alerts.push({ label: 'Tachycardia', severity: 'warning' });
  if (vitals.heart_rate < 50) alerts.push({ label: 'Bradycardia', severity: 'danger' });
  if (vitals.blood_pressure_sys < 90) alerts.push({ label: 'Hypotension', severity: 'danger' });
  if (vitals.blood_pressure_sys > 160) alerts.push({ label: 'Hypertension', severity: 'warning' });
  if (vitals.respiratory_rate > 25) alerts.push({ label: 'Tachypnea', severity: 'warning' });
  if (riskLevel === 'critical') alerts.push({ label: 'HIGH DETERIORATION RISK', severity: 'danger' });

  const clinicalLines = generateClinicalText(patient, vitals, prediction);
  const handoverLines = generateHandoverNotes(patient, vitals, prediction);
  const execSummary   = generateExecutiveSummary(patient, vitals, prediction);

  const isLoading = loadingStep > 0 && loadingStep < 5;
  const isDone    = loadingStep === 5;

  // Build plain-text for clipboard
  const buildPlainText = () => {
    const lines = [];
    lines.push('====================================');
    lines.push('PATIENT CLINICAL SUMMARY REPORT');
    lines.push('====================================');
    lines.push(`Generated: ${generatedAt?.toLocaleString()}`);
    lines.push(`Generated By: ICU Assistant AI`);
    lines.push('');
    lines.push(`Patient: ${patient?.name} (${patient?.patient_id})`);
    lines.push(`Age/Gender: ${patient?.age}y / ${patient?.gender}`);
    lines.push(`Diagnosis: ${patient?.diagnosis}`);
    lines.push(`Bed: ${patient?.bed_id}`);
    lines.push('');
    lines.push(`Risk Score: ${riskScore}% — ${riskLevel.toUpperCase()}`);
    lines.push('');
    lines.push('VITALS:');
    lines.push(`  HR: ${vitals.heart_rate ?? '--'} bpm`);
    lines.push(`  BP: ${vitals.blood_pressure_sys ?? '--'}/${vitals.blood_pressure_dia ?? '--'} mmHg`);
    lines.push(`  SpO₂: ${vitals.spo2 ?? '--'}%`);
    lines.push(`  RR: ${vitals.respiratory_rate ?? '--'} /min`);
    lines.push(`  Temp: ${vitals.temperature ?? '--'}°C`);
    lines.push('');
    lines.push('CLINICAL SUMMARY:');
    clinicalLines.forEach(l => lines.push('  ' + l));
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildPlainText()).catch(() => {});
  };

  const handlePrint = () => {
    window.print();
  };

  const reportData = {
    generatedAt: generatedAt?.toISOString(),
    reportMode,
    patient: {
      patient_id: patient?.patient_id,
      name: patient?.name,
      age: patient?.age,
      gender: patient?.gender,
      bed_id: patient?.bed_id,
      admitted_at: patient?.admitted_at,
      diagnosis: patient?.diagnosis,
    },
    vitals,
    riskScore,
    riskLevel,
    alerts: alerts.map(a => a.label),
    prediction: prediction ?? null,
    clinicalSummary: clinicalLines,
  };

  return (
    <div className="prm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="prm-modal" role="dialog" aria-modal="true" aria-label="Patient Report">

        {/* ── Top Bar ── */}
        <div className="prm-topbar">
          <div className="prm-topbar-left">
            <div className="prm-logo">
              <span className="prm-logo-icon">🏥</span>
              <div>
                <div className="prm-logo-title">ICU Clinical Intelligence</div>
                <div className="prm-logo-sub">Patient Summary Report</div>
              </div>
            </div>
          </div>
          <div className="prm-topbar-right">
            <button className="prm-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* ── Mode Tabs ── */}
        <div className="prm-tabs-bar">
          {[
            { id: 'clinical',   label: 'Clinical Summary',    icon: '🩺' },
            { id: 'executive',  label: 'Executive Summary',   icon: '📊' },
            { id: 'handover',   label: 'Shift Handover',      icon: '🔄' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`prm-tab ${reportMode === tab.id ? 'prm-tab--active' : ''}`}
              onClick={() => setReportMode(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="prm-body" ref={reportRef}>

          {/* Loading State */}
          {isLoading && (
            <div className="prm-loading">
              <div className="prm-loading-pulse">
                <div className="prm-loading-ring" />
                <span className="prm-loading-icon">🤖</span>
              </div>
              <div className="prm-loading-steps">
                {LOADING_STEPS.map(step => (
                  <div
                    key={step.id}
                    className={`prm-step ${loadingStep === step.id ? 'prm-step--active' : ''} ${loadingStep > step.id ? 'prm-step--done' : ''}`}
                  >
                    <span className="prm-step-icon">
                      {loadingStep > step.id ? '✅' : step.icon}
                    </span>
                    <span className="prm-step-text">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Content */}
          {isDone && (
            <div className="prm-report" ref={printRef}>

              {/* Report Header */}
              <div className="prm-report-header">
                <div className="prm-report-title-block">
                  <div className="prm-report-title">Patient Clinical Summary Report</div>
                  <div className="prm-report-meta">
                    <span>Generated: {generatedAt?.toLocaleString()}</span>
                    <span className="prm-dot">·</span>
                    <span>by ICU Assistant AI</span>
                    <span className="prm-dot">·</span>
                    <span className="prm-mode-label">{reportMode === 'clinical' ? 'Clinical Summary' : reportMode === 'executive' ? 'Executive Summary' : 'Shift Handover'}</span>
                  </div>
                </div>
                <RiskBadge level={riskLevel} score={riskScore} size="lg" showScore />
              </div>

              {/* Alert Banner */}
              {alerts.length > 0 && (
                <div className="prm-alert-banner">
                  <span className="prm-alert-icon">⚠</span>
                  <div className="prm-alert-chips">
                    {alerts.map((a, i) => <AlertChip key={i} label={a.label} severity={a.severity} />)}
                  </div>
                </div>
              )}

              {/* ── CLINICAL SUMMARY MODE ── */}
              {reportMode === 'clinical' && (
                <>
                  <ReportSection title="Patient Information" icon="🪪" accent="default">
                    <ReportRow label="Patient ID"      value={patient?.patient_id} />
                    <ReportRow label="Full Name"       value={patient?.name} />
                    <ReportRow label="Age / Gender"    value={`${patient?.age ?? '?'}y / ${patient?.gender ?? '—'}`} />
                    <ReportRow label="Bed Number"      value={patient?.bed_id} />
                    <ReportRow label="Admission Date"  value={patient?.admitted_at ? new Date(patient.admitted_at).toLocaleDateString() : '—'} />
                    <ReportRow label="Primary Diagnosis" value={patient?.diagnosis} highlight />
                    <ReportRow label="Assigned Doctor" value={patient?.doctor || 'On-call Team'} />
                  </ReportSection>

                  <ReportSection title="Current Clinical Status" icon="🫀" accent={riskLevel === 'critical' ? 'danger' : riskLevel === 'high' ? 'warning' : 'success'}>
                    <ReportRow label="Risk Score"   value={`${riskScore}%`} highlight />
                    <ReportRow label="Risk Level"   value={riskLevel.toUpperCase()} />
                    <ReportRow label="Status"       value={patient?.status?.toUpperCase() || '—'} />
                    <ReportRow label="Escalation"   value={prediction?.escalation?.level || 'Routine'} />
                    <ReportRow label="Ventilation"  value={vitals.ventilated ? 'Yes — Mechanically Ventilated' : 'No'} />
                    <ReportRow label="O₂ Support"   value={vitals.oxygen_support || 'Room Air'} />
                  </ReportSection>

                  <ReportSection title="Vital Signs" icon="📊" accent="info">
                    <div className="prm-vitals-grid">
                      <VitalMiniCard label="Heart Rate"     value={vitals.heart_rate}          unit=" bpm"   trend={hrTrend}   warning={vitals.heart_rate > 110 || vitals.heart_rate < 50} />
                      <VitalMiniCard label="Blood Pressure" value={`${vitals.blood_pressure_sys ?? '--'}/${vitals.blood_pressure_dia ?? '--'}`} unit=" mmHg" trend={bpTrend} warning={vitals.blood_pressure_sys < 90 || vitals.blood_pressure_sys > 160} />
                      <VitalMiniCard label="SpO₂"          value={vitals.spo2}                unit="%"      trend={spo2Trend} warning={vitals.spo2 < 94} />
                      <VitalMiniCard label="Resp. Rate"     value={vitals.respiratory_rate}   unit=" /min"  trend={rrTrend}   warning={vitals.respiratory_rate > 22} />
                      <VitalMiniCard label="Temperature"    value={vitals.temperature}         unit="°C"     trend="stable"    warning={vitals.temperature > 38.5} />
                      <VitalMiniCard label="MAP"            value={vitals.map ?? (vitals.blood_pressure_sys && vitals.blood_pressure_dia ? Math.round((vitals.blood_pressure_sys + 2 * vitals.blood_pressure_dia) / 3) : null)} unit=" mmHg" trend="stable" warning={false} />
                    </div>
                  </ReportSection>

                  <ReportSection title="Risk Analysis" icon="🧠" accent={riskLevel === 'critical' ? 'danger' : 'warning'} tag="AI-Generated">
                    <ReportRow label="7-Day Deterioration Risk" value={`${riskScore}%`} highlight />
                    <ReportRow label="Top Risk Factor"          value={prediction?.top_factor || 'Multiple factors'} />
                    <ReportRow label="Model Confidence"         value={`${prediction?.confidence ?? 92}%`} />
                    <div className="prm-ai-text">
                      {clinicalLines.map((line, i) => (
                        <p key={i} className="prm-ai-para">{line}</p>
                      ))}
                    </div>
                  </ReportSection>

                  <ReportSection title="Recommendations" icon="✅" accent="success">
                    <ReportRow label="Review Priority"     value={riskLevel === 'critical' ? 'IMMEDIATE' : riskLevel === 'high' ? 'URGENT' : 'ROUTINE'} highlight />
                    <ReportRow label="Monitoring Focus"    value={vitals.spo2 < 94 ? 'Respiratory Status' : vitals.heart_rate > 110 ? 'Cardiac Status' : 'Standard Protocol'} />
                    <ReportRow label="Next Review"         value={riskLevel === 'critical' ? 'Within 1 hour' : riskLevel === 'high' ? 'Within 4 hours' : 'Next scheduled round'} />
                    <div className="prm-recommendation-text">
                      {prediction?.recommendation || 'Continue current monitoring protocol. Notify attending if vitals deteriorate.'}
                    </div>
                  </ReportSection>
                </>
              )}

              {/* ── EXECUTIVE SUMMARY MODE ── */}
              {reportMode === 'executive' && (
                <>
                  <ReportSection title="Executive Summary" icon="📋" accent="default" tag="AI-Generated">
                    <div className="prm-exec-block">
                      <p className="prm-exec-text">{execSummary}</p>
                    </div>
                  </ReportSection>

                  <ReportSection title="Key Metrics" icon="📊" accent="info">
                    <div className="prm-vitals-grid">
                      <VitalMiniCard label="Heart Rate"     value={vitals.heart_rate}         unit=" bpm"   trend={hrTrend}   warning={vitals.heart_rate > 110} />
                      <VitalMiniCard label="Blood Pressure" value={`${vitals.blood_pressure_sys ?? '--'}/${vitals.blood_pressure_dia ?? '--'}`} unit=" mmHg" trend={bpTrend} warning={vitals.blood_pressure_sys < 90} />
                      <VitalMiniCard label="SpO₂"          value={vitals.spo2}               unit="%"      trend={spo2Trend} warning={vitals.spo2 < 94} />
                      <VitalMiniCard label="7-Day Risk"     value={riskScore}                 unit="%"      trend="stable"    warning={riskScore > 50} />
                    </div>
                  </ReportSection>

                  <ReportSection title="Action Items" icon="⚡" accent={riskLevel === 'critical' ? 'danger' : 'warning'}>
                    <ul className="prm-action-list">
                      {riskLevel === 'critical' && <li className="prm-action-item prm-action-item--critical">🚨 Immediate intensivist review required</li>}
                      {alerts.map((a, i) => (
                        <li key={i} className={`prm-action-item prm-action-item--${a.severity}`}>
                          {a.severity === 'danger' ? '🔴' : '🟡'} {a.label} — clinical attention needed
                        </li>
                      ))}
                      <li className="prm-action-item">📋 Continue AI-assisted monitoring</li>
                      <li className="prm-action-item">🔄 Reassess vitals in {riskLevel === 'critical' ? '1' : riskLevel === 'high' ? '4' : '8'} hours</li>
                    </ul>
                  </ReportSection>
                </>
              )}

              {/* ── HANDOVER MODE ── */}
              {reportMode === 'handover' && (
                <>
                  <ReportSection title="Handover Summary" icon="🔄" accent="info">
                    <ul className="prm-handover-list">
                      {handoverLines.map((line, i) => (
                        <li key={i} className="prm-handover-item">{line}</li>
                      ))}
                    </ul>
                  </ReportSection>

                  <ReportSection title="Active Flags" icon="🚩" accent={alerts.length ? 'danger' : 'success'}>
                    {alerts.length > 0 ? (
                      <div className="prm-chips-row">
                        {alerts.map((a, i) => <AlertChip key={i} label={a.label} severity={a.severity} />)}
                      </div>
                    ) : (
                      <p className="prm-no-alerts">✅ No active clinical alerts at this time.</p>
                    )}
                  </ReportSection>

                  <ReportSection title="Vitals at Handover" icon="📊" accent="default">
                    <ReportRow label="Heart Rate"      value={`${vitals.heart_rate ?? '--'} bpm`}   trend={hrTrend} />
                    <ReportRow label="Blood Pressure"  value={`${vitals.blood_pressure_sys ?? '--'}/${vitals.blood_pressure_dia ?? '--'} mmHg`} trend={bpTrend} />
                    <ReportRow label="SpO₂"            value={`${vitals.spo2 ?? '--'}%`}            trend={spo2Trend} />
                    <ReportRow label="Resp. Rate"      value={`${vitals.respiratory_rate ?? '--'} /min`} trend={rrTrend} />
                    <ReportRow label="Temperature"     value={`${vitals.temperature ?? '--'}°C`} />
                  </ReportSection>

                  <ReportSection title="Incoming Shift Instructions" icon="📝" accent="success">
                    <div className="prm-recommendation-text">
                      Monitor for changes in {vitals.spo2 < 94 ? 'respiratory status and SpO₂ levels' : vitals.heart_rate > 100 ? 'heart rate and hemodynamic stability' : 'general vitals'}. Risk score is {riskScore}% — {riskLevel === 'critical' ? 'escalate immediately if any deterioration is noted' : riskLevel === 'high' ? 'notify attending if vitals worsen' : 'continue standard monitoring schedule'}.
                      {prediction?.recommendation && ` AI Note: ${prediction.recommendation}`}
                    </div>
                  </ReportSection>
                </>
              )}

            </div>
          )}
        </div>

        {/* ── Sticky Action Bar ── */}
        <div className="prm-actionbar">
          <div className="prm-actionbar-left">
            {isDone && generatedAt && (
              <span className="prm-generated-time">
                📅 Generated {generatedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="prm-actionbar-right">
            <button
              className="prm-btn-regen"
              onClick={() => setKey(k => k + 1)}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Generating...' : '🔄 Regenerate'}
            </button>
            <ExportMenu
              onExportPrint={handlePrint}
              onCopyClipboard={handleCopy}
              onExportJSON={() => {}}
              reportData={reportData}
              disabled={!isDone}
            />
          </div>
        </div>

      </div>
    </div>
  );
}