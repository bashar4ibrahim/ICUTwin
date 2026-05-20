import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiCpu,
  FiEye,
  FiFileText,
  FiImage,
  FiMap,
  FiRefreshCw,
  FiShield,
  FiUploadCloud,
  FiUser,
  FiZap,
} from 'react-icons/fi';
import './OracleAssessment_v2.css';

function pathColor(score) {
  if (score >= 0.6) return '#f43f5e';
  if (score >= 0.4) return '#f97316';
  if (score >= 0.25) return '#f59e0b';
  return '#10b981';
}

function riskTone(category = '') {
  const normalized = String(category).toUpperCase();
  if (normalized.includes('HIGH') || normalized.includes('CRIT')) return 'high';
  if (normalized.includes('MODERATE') || normalized.includes('WARN')) return 'moderate';
  return 'low';
}

function normalizePercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric > 1 ? numeric / 100 : numeric;
}

function MD({ text }) {
  const html = String(text || 'No reasoning returned yet.')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  return (
    <div
      className="oracle-reasoning"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  );
}

function drawHeatmap(canvas, heatmap, imgEl) {
  if (!canvas || !heatmap || !imgEl || !Array.isArray(heatmap) || !heatmap.length) return;

  const displayW = imgEl.clientWidth || imgEl.naturalWidth || imgEl.width || 224;
  const displayH = imgEl.clientHeight || imgEl.naturalHeight || imgEl.height || 224;
  canvas.width = displayW;
  canvas.height = displayH;
  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, displayW, displayH);

  const rows = heatmap.length;
  const cols = heatmap[0]?.length || 0;
  if (!cols) return;

  const cw = displayW / cols;
  const ch = displayH / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const v = Number(heatmap[r][c]) || 0;
      if (v < 0.15) continue;
      const g = Math.round(255 * (1 - v));
      ctx.fillStyle = `rgba(255,${g},0,${Math.min(0.82, v * 0.9)})`;
      ctx.fillRect(c * cw + 2, r * ch + 2, Math.max(0, cw - 4), Math.max(0, ch - 4));
    }
  }
}

function MetricPill({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className={`oracle-metric-pill tone-${tone}`}>
      <Icon />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PathologyChart({ scores }) {
  const sorted = useMemo(
    () => Object.entries(scores || {}).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 14),
    [scores]
  );

  if (!sorted.length) {
    return <div className="oracle-empty-mini">No pathology score matrix returned.</div>;
  }

  return (
    <div className="oracle-pathology-chart">
      {sorted.map(([name, rawScore]) => {
        const score = normalizePercent(rawScore);
        return (
          <div key={name} className="oracle-path-row">
            <span className="oracle-path-name" title={name}>{name}</span>
            <div className="oracle-path-track">
              <div
                className="oracle-path-fill"
                style={{ width: `${Math.round(score * 100)}%`, background: pathColor(score) }}
              />
            </div>
            <span className="oracle-path-pct" style={{ color: pathColor(score) }}>
              {Math.round(score * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopFindings({ findings }) {
  if (!findings?.length) {
    return (
      <div className="oracle-clear-card">
        <FiCheckCircle />
        <span>No high-confidence pathology detected</span>
      </div>
    );
  }

  return (
    <div className="oracle-findings-grid">
      {findings.slice(0, 4).map((finding, index) => {
        const score = normalizePercent(finding.score);
        const col = pathColor(score);
        return (
          <div
            key={`${finding.name}-${index}`}
            className="oracle-finding-card"
            style={{ '--finding-color': col }}
          >
            <span>{finding.name}</span>
            <strong>{Math.round(score * 100)}%</strong>
          </div>
        );
      })}
    </div>
  );
}

function RiskGauge({ score = 0, category = 'LOW' }) {
  const tone = riskTone(category);
  const normalized = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

  return (
    <div className={`oracle-risk-card tone-${tone}`}>
      <div className="oracle-risk-orbit" style={{ '--risk-score': `${normalized}%` }}>
        <div className="oracle-risk-core">
          <strong>{normalized}</strong>
          <span>%</span>
        </div>
      </div>
      <div>
        <p>Fusion Risk</p>
        <h3>{String(category || 'LOW').toUpperCase()} RISK</h3>
      </div>
    </div>
  );
}

function AttentionBars({ attn }) {
  const bars = [
    { label: 'X-Ray', val: attn?.xray ?? attn?.vision, color: '#0ea5e9' },
    { label: 'Notes', val: attn?.text, color: '#8b5cf6' },
    { label: 'Vitals', val: attn?.vitals, color: '#f59e0b' },
  ];

  return (
    <div className="oracle-attention-panel">
      <div className="oracle-section-title">
        <FiEye />
        <span>Attention Weights</span>
      </div>
      {bars.map((bar) => {
        const val = normalizePercent(bar.val);
        return (
          <div key={bar.label} className="oracle-attn-row">
            <span>{bar.label}</span>
            <div className="oracle-attn-track">
              <div className="oracle-attn-fill" style={{ width: `${Math.round(val * 100)}%`, background: bar.color }} />
            </div>
            <strong style={{ color: bar.color }}>{Math.round(val * 100)}%</strong>
          </div>
        );
      })}
    </div>
  );
}

export default function OracleAssessment({
  token,
  patients,
  apiBase = 'https://capstone.dpdns.org',
  wsBase = 'wss://capstone.dpdns.org',
}) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [imageB64, setImageB64] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('reasoning');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [thinkLog, setThinkLog] = useState([]);
  const [result, setResult] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const thinkRef = useRef(null);
  const wsRef = useRef(null);
  const fileInput = useRef(null);

  const patient = useMemo(
    () => patients?.find((entry) => entry.patient_id === selectedPatient),
    [patients, selectedPatient]
  );

  const isRunning = ['queued', 'processing'].includes(status);
  const canRun = Boolean(imageB64) && !isRunning;
  const topPathology = result?.top_findings?.[0];

  useEffect(() => {
    if (thinkRef.current) thinkRef.current.scrollTop = thinkRef.current.scrollHeight;
  }, [thinkLog]);

  useEffect(() => {
    if (result?.heatmap && imageLoaded && imgRef.current && canvasRef.current) {
      drawHeatmap(canvasRef.current, result.heatmap, imgRef.current);
    }
  }, [result, imageLoaded]);

  const handleImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      setImageB64(event.target.result);
      setImageLoaded(false);
      setResult(null);
      setThinkLog([]);
      setStatus('idle');
      setProgress(0);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    setDragging(false);
    handleImage(event.dataTransfer.files[0]);
  }, [handleImage]);

  const reset = useCallback(() => {
    wsRef.current?.close();
    setImageB64('');
    setImagePreview(null);
    setClinicalNotes('');
    setImageLoaded(false);
    setStatus('idle');
    setProgress(0);
    setThinkLog([]);
    setResult(null);
    setActiveTab('reasoning');
  }, []);

  const startAssessment = async () => {
    if (!imageB64) return;
    const vitals = patient?.latest_vitals || {};

    setStatus('queued');
    setProgress(0);
    setThinkLog([{ msg: 'Starting multimodal assessment pipeline...' }]);
    setResult(null);
    setActiveTab('reasoning');

    try {
      const resp = await fetch(`${apiBase}/icu/ai/oracle/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: selectedPatient || 'DEMO',
          image_base64: imageB64,
          clinical_notes: clinicalNotes,
          vitals,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      const { task_id } = await resp.json();

      const ws = new WebSocket(`${wsBase}/icu/ai/oracle/ws/${task_id}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'thinking') {
          setStatus('processing');
          setProgress(msg.progress || 0);
          setThinkLog((prev) => [...prev, { msg: msg.message }]);
        } else if (msg.type === 'complete') {
          setStatus('complete');
          setProgress(1);
          setThinkLog((prev) => [...prev, { msg: 'Assessment complete. Fusion report ready.', done: true }]);
          setResult(msg);
          ws.close();
        } else if (msg.type === 'error') {
          setStatus('error');
          setThinkLog((prev) => [...prev, { msg: msg.message || 'Oracle assessment failed.' }]);
          ws.close();
        }
      };

      ws.onerror = () => {
        const poll = setInterval(async () => {
          try {
            const r = await fetch(`${apiBase}/icu/ai/oracle/task/${task_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await r.json();
            if (data.status === 'complete') {
              clearInterval(poll);
              setStatus('complete');
              setProgress(1);
              setResult(data.result);
            }
          } catch {
            clearInterval(poll);
          }
        }, 3000);
      };
    } catch (error) {
      setStatus('failed');
      setThinkLog((prev) => [...prev, { msg: error.message || 'Oracle assessment failed.' }]);
    }
  };

  return (
    <div className="oracle-page">
      <section className="oracle-hero">
        <div className="oracle-hero-copy">
          <div className="oracle-kicker">
            <FiCpu />
            Multimodal AI Oracle
          </div>
          <h1>Chest X-ray intelligence fused with bedside context.</h1>
          <p>
            A premium assessment cockpit for radiology signals, clinical notes, vitals,
            attention weighting, and explainable risk output in one smooth workflow.
          </p>
          <div className="oracle-hero-actions">
            <button type="button" className="oracle-primary-btn" onClick={() => fileInput.current?.click()}>
              <FiUploadCloud />
              Upload X-ray
            </button>
            <button type="button" className="oracle-secondary-btn" onClick={reset}>
              <FiRefreshCw />
              Reset workspace
            </button>
          </div>
        </div>

        <div className="oracle-hero-panel">
          <MetricPill icon={FiActivity} label="Fusion Stack" value="Vision + Notes + Vitals" />
          <MetricPill icon={FiShield} label="Model" value="DenseNet-121" tone="cyan" />
          <MetricPill icon={FiZap} label="Runtime" value={status === 'idle' ? 'Ready' : status} tone={isRunning ? 'warning' : 'success'} />
        </div>
      </section>

      {isRunning && (
        <div className="oracle-progress-shell">
          <span>Oracle processing</span>
          <div className="oracle-progress-bar">
            <div className="oracle-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
      )}

      <section className="oracle-grid">
        <div className="oracle-card oracle-input-card">
          <div className="oracle-card-header">
            <div>
              <span>Input Console</span>
              <h2>Prepare assessment</h2>
            </div>
            <FiImage />
          </div>

          <div
            className={`oracle-upload-zone ${dragging ? 'drag-over' : ''} ${imagePreview ? 'has-image' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => handleImage(event.target.files[0])}
            />
            {imagePreview ? (
              <div className="oracle-viewport">
                <img
                  ref={imgRef}
                  src={imagePreview}
                  alt="Uploaded chest X-ray"
                  onLoad={() => setImageLoaded(true)}
                />
                {result?.heatmap && <canvas ref={canvasRef} className="oracle-heatmap-canvas" />}
                <div className="oracle-scanline" />
              </div>
            ) : (
              <div className="oracle-upload-empty">
                <div className="oracle-upload-icon"><FiUploadCloud /></div>
                <h3>Drop chest X-ray here</h3>
                <p>JPG or PNG. Click anywhere in this panel to browse.</p>
              </div>
            )}
          </div>

          <div className="oracle-form-stack">
            <label className="oracle-field">
              <span><FiUser /> Patient context</span>
              <select value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)}>
                <option value="">No patient selected (demo mode)</option>
                {(patients || []).map((entry) => (
                  <option key={entry.patient_id} value={entry.patient_id}>
                    {entry.patient_id} - {entry.name || 'Unknown'}
                  </option>
                ))}
              </select>
            </label>

            {patient && (
              <div className="oracle-patient-strip">
                <span>{patient.name || patient.patient_id}</span>
                <strong>{patient.bed_id || patient.bed || 'ICU'}</strong>
                <em>{patient.diagnosis || 'Clinical context linked'}</em>
              </div>
            )}

            <label className="oracle-field">
              <span><FiFileText /> Clinical notes</span>
              <textarea
                value={clinicalNotes}
                onChange={(event) => setClinicalNotes(event.target.value)}
                placeholder="Example: high fever, SpO2 dropping, COPD history, persistent cough, new infiltrates suspected..."
                rows={5}
              />
            </label>

            <button type="button" className="oracle-run-btn" onClick={startAssessment} disabled={!canRun}>
              {status === 'queued' ? 'Queuing assessment...' : status === 'processing' ? 'Oracle is thinking...' : 'Run Oracle Assessment'}
              <FiZap />
            </button>
          </div>
        </div>

        <div className="oracle-card oracle-output-card">
          <div className="oracle-card-header">
            <div>
              <span>AI Output</span>
              <h2>Decision intelligence</h2>
            </div>
            <FiBarChart2 />
          </div>

          {!result && status === 'idle' && (
            <div className="oracle-idle-state">
              <div className="oracle-idle-orb"><FiCpu /></div>
              <h3>Ready for assessment</h3>
              <p>Upload an X-ray, attach patient context, then run the Oracle pipeline.</p>
              <div className="oracle-idle-list">
                <span>18 pathology probability matrix</span>
                <span>Grad-CAM attention overlay</span>
                <span>Clinical reasoning report</span>
              </div>
            </div>
          )}

          {thinkLog.length > 0 && (
            <div className="oracle-thinking" ref={thinkRef}>
              <div className="oracle-section-title">
                <FiCpu />
                <span>Live Reasoning Stream</span>
              </div>
              {thinkLog.map((entry, index) => (
                <p key={`${entry.msg}-${index}`} className={entry.done ? 'done' : ''}>
                  {entry.done ? <FiCheckCircle /> : <FiActivity />}
                  <span>{entry.msg}</span>
                </p>
              ))}
            </div>
          )}

          {result && (
            <div className="oracle-results">
              <div className="oracle-result-top">
                <RiskGauge score={result.risk_score} category={result.risk_category} />
                <AttentionBars attn={result.attention} />
              </div>

              <div className="oracle-insight-row">
                <div className="oracle-insight-card">
                  <FiAlertTriangle />
                  <span>Top Finding</span>
                  <strong>{topPathology?.name || 'No dominant signal'}</strong>
                </div>
                <div className="oracle-insight-card">
                  <FiMap />
                  <span>Heatmap Peak</span>
                  <strong>{result.heatmap_peak ? `${Math.round(normalizePercent(result.heatmap_peak) * 100)}%` : 'Pending'}</strong>
                </div>
              </div>

              <TopFindings findings={result.top_findings} />

              <div className="oracle-tabs">
                {[
                  ['reasoning', 'Reasoning'],
                  ['pathologies', 'Pathologies'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={activeTab === id ? 'active' : ''}
                    onClick={() => setActiveTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'reasoning' ? (
                <MD text={result.reasoning} />
              ) : (
                <div className="oracle-pathology-panel">
                  <PathologyChart scores={result.pathology_scores} />
                </div>
              )}

              {result.heatmap && imagePreview && (
                <div className="oracle-heatmap-note">
                  <FiEye />
                  Grad-CAM overlay is active on the uploaded X-ray. Warmer regions indicate stronger model attention.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
