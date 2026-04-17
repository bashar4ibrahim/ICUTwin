import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../styles/patientReport.css';
import { apiFetch } from '../services/api';
import { createPatientReportAssistantMessage } from '../services/patientReports';
import {
  exportPatientReportPdf,
  generatePatientReportDocument,
  printPatientReport,
} from '../services/patientReportFlow';
import PatientReportDocument from './PatientReportDocument';

const previewVitalValue = (value) => (value === null || value === undefined || value === '' ? '-' : value);
const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

export default function PatientReportPage({
  initialPatientId = null,
  requestNonce = 0,
  snapshots = EMPTY_OBJECT,
  predictions = EMPTY_OBJECT,
  predictionHistory = EMPTY_OBJECT,
  alerts = EMPTY_ARRAY,
  feedback = EMPTY_ARRAY,
  auditLog = EMPTY_ARRAY,
  registerPatients,
  onPatientChange,
}) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
  const [report, setReport] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printingReport, setPrintingReport] = useState(false);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const handledRequestNonce = useRef(0);

  const mergedPatients = useMemo(() => {
    const map = new Map();

    Object.values(snapshots || {}).forEach((patient) => {
      if (patient?.patient_id) map.set(patient.patient_id, patient);
    });

    (patients || []).forEach((patient) => {
      if (!patient?.patient_id) return;
      const existing = map.get(patient.patient_id) || {};
      map.set(patient.patient_id, {
        ...existing,
        ...patient,
        latest_vitals: patient.latest_vitals || existing.latest_vitals || {},
      });
    });

    return Array.from(map.values());
  }, [patients, snapshots]);

  const selectedPatient = useMemo(
    () => mergedPatients.find((patient) => patient.patient_id === selectedPatientId) || null,
    [mergedPatients, selectedPatientId]
  );

  const assistantCopy = useMemo(() => createPatientReportAssistantMessage(report), [report]);

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true);
    setError('');
    try {
      const payload = await apiFetch('/icu/patients');
      const nextPatients = payload?.patients || [];
      setPatients(nextPatients);
      registerPatients?.(nextPatients, 'patient-report-list');

      if (nextPatients.length > 0) {
        setSelectedPatientId((current) => {
          if (current) return current;
          const firstPatientId = nextPatients[0].patient_id;
          onPatientChange?.(firstPatientId);
          return firstPatientId;
        });
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load patients for report generation.');
    } finally {
      setLoadingPatients(false);
    }
  }, [onPatientChange, registerPatients]);

  const generateReportForPatient = useCallback(
    async (patientId, options = {}) => {
      if (!patientId) return;
      const { openPreview = false } = options;

      setGenerating(true);
      setError('');

      try {
        const result = await generatePatientReportDocument({
          patientId,
          patient: mergedPatients.find((item) => item.patient_id === patientId) || snapshots?.[patientId] || null,
          patients: mergedPatients,
          snapshots,
          predictions,
          predictionHistory,
          alerts,
          feedback,
          auditLog,
        });

        setReport(result.report);
        if (openPreview) setPreviewOpen(true);

        return result.report;
      } catch (generationError) {
        setError(generationError.message || 'Unable to generate the patient report.');
        setReport(null);
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [alerts, auditLog, feedback, mergedPatients, predictions, predictionHistory, snapshots]
  );

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  useEffect(() => {
    if (!selectedPatientId || !requestNonce) return;
    if (handledRequestNonce.current === requestNonce) return;
    handledRequestNonce.current = requestNonce;
    generateReportForPatient(selectedPatientId, { openPreview: true });
  }, [generateReportForPatient, requestNonce, selectedPatientId]);

  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId);
    setPreviewOpen(false);
    onPatientChange?.(patientId);
  };

  const handleGenerate = async () => {
    if (!selectedPatientId || generating) return;
    await generateReportForPatient(selectedPatientId, { openPreview: true });
  };

  const handlePreview = () => {
    if (!report) return;
    setPreviewOpen(true);
  };

  const handleExportPdf = async () => {
    if (!report || exportingPdf) return;

    setExportingPdf(true);
    setError('');

    try {
      const exported = await exportPatientReportPdf(report, assistantCopy);
      if (!exported) setError('Unable to export the patient report PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!report || printingReport) return;
    setPrintingReport(true);
    setError('');
    const opened = printPatientReport(report, assistantCopy);
    if (!opened) setError('Unable to open the report print dialog.');
    window.setTimeout(() => setPrintingReport(false), 1200);
  };

  return (
    <div className="patient-report-page">
      <div className="page-header">
        <h1>Patient Report</h1>
        <p>Executive-ready clinical summary with preview, print, and polished PDF export.</p>
        <div className="page-subtitle-bar" />
      </div>

      <div className="patient-report-toolbar">
        <div className="patient-report-toolbar-meta">
          <span className="patient-report-meta-chip">
            Selected Patient: {selectedPatient?.name || selectedPatientId || 'Choose a patient'}
          </span>
          {report && <span className="patient-report-meta-chip">Last Generated: {report.generatedLabel}</span>}
          {report && <span className="patient-report-meta-chip">Document Status: Ready for review</span>}
        </div>

        <div className="patient-report-actions">
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!selectedPatientId || generating || exportingPdf || printingReport}
          >
            {generating ? 'Generating Summary...' : 'Generate Report'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handlePreview}
            disabled={!report || generating || exportingPdf || printingReport}
          >
            Preview Summary
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportPdf}
            disabled={!report || generating || exportingPdf || printingReport}
          >
            {exportingPdf ? 'Preparing PDF...' : 'Download PDF'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={handlePrint}
            disabled={!report || generating || exportingPdf || printingReport}
          >
            {printingReport ? 'Opening Print...' : 'Print Document'}
          </button>
        </div>
      </div>

      <div className="patient-report-layout">
        <aside className="patient-report-sidebar">
          <section className="card">
            <div className="card-title">Patient Selector</div>
            {loadingPatients ? (
              <div className="patient-report-loading-stack">
                <div className="patient-report-loading-line is-full" />
                <div className="patient-report-loading-line is-medium" />
                <div className="patient-report-loading-line is-short" />
              </div>
            ) : (
              <div className="patient-report-selector">
                {mergedPatients.map((patient) => (
                  <button
                    key={patient.patient_id}
                    type="button"
                    className={`patient-report-patient${selectedPatientId === patient.patient_id ? ' is-selected' : ''}`}
                    onClick={() => handlePatientSelect(patient.patient_id)}
                  >
                    <div className="patient-report-patient-row">
                      <span className="patient-report-patient-name">{patient.name || patient.patient_id}</span>
                      <span className={`badge badge-${patient.status === 'critical' ? 'critical' : 'stable'}`}>
                        {patient.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="patient-report-patient-meta">
                      {patient.patient_id} - {patient.bed_id || 'Bed TBD'} - {patient.diagnosis || 'Diagnosis pending'}
                    </div>
                    <div className="patient-report-patient-vitals">
                      {[
                        ['HR', previewVitalValue(patient.latest_vitals?.heart_rate)],
                        ['SpO2', previewVitalValue(patient.latest_vitals?.spo2)],
                        ['Temp', previewVitalValue(patient.latest_vitals?.temperature)],
                      ].map(([label, value]) => (
                        <div key={label} className="patient-report-vital-chip">
                          <div className="patient-report-vital-value">{value}</div>
                          <div className="patient-report-vital-label">{label}</div>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-title">Report Notes</div>
            <div className="patient-report-patient-meta">
              This document combines current patient state, live vitals context, risk signals, treatment notes, and
              AI recommendations into a polished clinical summary suitable for review, demo, printing, and PDF export.
            </div>
          </section>
        </aside>

        <section>
          {generating && !report ? (
            <div className="patient-report-loading">
              <div>
                <h3 className="patient-report-loading-title">Generating patient report</h3>
                <p className="patient-report-loading-copy">
                  Preparing the in-app preview and assembling the full clinical document from patient, vitals, and AI data.
                </p>
                <div className="patient-report-loading-stack">
                  <div className="patient-report-loading-line is-full" />
                  <div className="patient-report-loading-line is-medium" />
                  <div className="patient-report-loading-line is-full" />
                  <div className="patient-report-loading-line is-short" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="patient-report-error">
              <div>
                <h3 className="patient-report-error-title">Unable to generate the report</h3>
                <p className="patient-report-error-copy">{error}</p>
              </div>
            </div>
          ) : report ? (
            <div className="patient-report-ready">
              <div className="patient-report-ready-kicker">Report Ready</div>
              <h3 className="patient-report-ready-title">{report.patientName} - {report.patientId}</h3>
              <p className="patient-report-ready-copy">
                The report opens in an in-app executive preview so it stays separate from the workspace. You can reopen
                it, print it, or download the polished PDF from the actions below.
              </p>
              <div className="patient-report-ready-grid">
                <div className="patient-report-ready-card">
                  <span>Last Generated</span>
                  <strong>{report.generatedLabel}</strong>
                </div>
                <div className="patient-report-ready-card">
                  <span>Status</span>
                  <strong>{report.executiveSummary?.status || 'Ready'}</strong>
                </div>
                <div className="patient-report-ready-card">
                  <span>Risk</span>
                  <strong>{report.aiInsights?.riskEstimate || 'Not available'}</strong>
                </div>
              </div>
              <div className="patient-report-ready-actions">
                <button className="btn btn-primary" onClick={handlePreview} disabled={generating || exportingPdf || printingReport}>
                  Open Preview
                </button>
                <button className="btn btn-secondary" onClick={handleExportPdf} disabled={generating || exportingPdf || printingReport}>
                  {exportingPdf ? 'Preparing PDF...' : 'Download PDF'}
                </button>
                <button className="btn btn-ghost" onClick={handlePrint} disabled={generating || exportingPdf || printingReport}>
                  {printingReport ? 'Opening Print...' : 'Print Document'}
                </button>
              </div>
            </div>
          ) : (
            <div className="patient-report-empty">
              <div>
                <h3 className="patient-report-empty-title">Select a patient to generate a report</h3>
                <p className="patient-report-empty-copy">
                  Generate Report opens an in-app executive preview with read, print, and PDF actions, while this page
                  stays as your report launcher.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {previewOpen && report && (
        <div className="modal-overlay patient-report-preview-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="modal patient-report-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header patient-report-preview-header">
              <div>
                <span className="patient-report-ready-kicker">Patient Report Preview</span>
                <div className="modal-title">{report.patientName} - {report.patientId}</div>
              </div>
              <button className="modal-close" onClick={() => setPreviewOpen(false)} aria-label="Close report preview">
                X
              </button>
            </div>

            <div className="patient-report-preview-actions">
              <button className="btn btn-secondary" onClick={handleExportPdf} disabled={exportingPdf || printingReport}>
                {exportingPdf ? 'Preparing PDF...' : 'Download PDF'}
              </button>
              <button className="btn btn-secondary" onClick={handlePrint} disabled={exportingPdf || printingReport}>
                {printingReport ? 'Opening Print...' : 'Print Document'}
              </button>
              <button className="btn btn-primary" onClick={() => setPreviewOpen(false)} disabled={exportingPdf}>
                Close Preview
              </button>
            </div>

            <div className="patient-report-preview-body">
              <PatientReportDocument report={report} assistantCopy={assistantCopy} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
