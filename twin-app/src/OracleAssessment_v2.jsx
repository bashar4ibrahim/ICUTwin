// ═══════════════════════════════════════════════════════════════════
// OracleAssessment v2 — Upgraded with TorchXRayVision
// Replace your existing OracleAssessment.jsx with this file
//
// New in v2:
//   - Pathology scores chart (all 18 conditions with real probabilities)
//   - Top findings cards with color-coded severity
//   - Better findings badges (pneumonia, effusion, opacity specific)
//   - Shows which dataset the model was trained on
// ═══════════════════════════════════════════════════════════════════

// ── CSS — add these to your <style> tag ─────────────────────────────
/*
.oracle-wrap { display:flex; flex-direction:column; gap:1.5rem; }
.oracle-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }
@media(max-width:900px){ .oracle-grid{ grid-template-columns:1fr; } }

.oracle-upload-zone {
  border: 2px dashed var(--accent,#00ffff);
  border-radius: 12px; padding: 2rem;
  text-align: center; cursor: pointer;
  transition: all .2s; background: rgba(0,255,255,.03);
  position: relative;
}
.oracle-upload-zone:hover, .oracle-upload-zone.drag-over {
  background: rgba(0,255,255,.08); border-color: #fff;
}
.oracle-heatmap-wrap { position: relative; display: inline-block;
  border-radius: 8px; overflow: hidden; }
.oracle-heatmap-wrap canvas { position: absolute; top:0; left:0;
  width:100%; height:100%; pointer-events:none; opacity:.65; border-radius:8px; }

.oracle-thinking {
  font-family: 'Courier New', monospace; font-size: .85rem;
  color: #00ffff; padding: 1rem;
  background: rgba(0,0,0,.4); border-radius: 8px;
  border: 1px solid rgba(0,255,255,.2);
  min-height: 140px; max-height: 200px; overflow-y: auto;
}
.oracle-thinking p { margin:.2rem 0; }
.oracle-thinking p.done { color:#4dff91; }

.oracle-risk-gauge { display:flex; flex-direction:column; align-items:center; gap:.5rem; }
.gauge-ring { width:110px; height:110px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  flex-direction:column; transition: all .8s;
  border: 6px solid transparent; }
.gauge-ring.low      { border-color:#4dff91; color:#4dff91;
  box-shadow:0 0 24px rgba(77,255,145,.4); }
.gauge-ring.moderate { border-color:#ffd700; color:#ffd700;
  box-shadow:0 0 24px rgba(255,215,0,.4); }
.gauge-ring.high     { border-color:#ff4d4d; color:#ff4d4d;
  box-shadow:0 0 24px rgba(255,77,77,.5);
  animation: pulse-red 1.4s infinite; }
@keyframes pulse-red {
  0%,100%{ box-shadow:0 0 24px rgba(255,77,77,.5); }
  50%    { box-shadow:0 0 48px rgba(255,77,77,.9); }
}

.attn-bar { display:flex; gap:.5rem; align-items:center; font-size:.8rem; margin:.25rem 0; }
.attn-track { flex:1; height:8px; background:rgba(255,255,255,.06);
  border-radius:4px; overflow:hidden; }
.attn-fill  { height:100%; border-radius:4px; transition:width .8s; }

.pathology-chart { display:flex; flex-direction:column; gap:4px; }
.path-row { display:flex; align-items:center; gap:6px; }
.path-name { font-size:11px; color:#aaa; width:130px; text-align:right;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.path-track { flex:1; height:12px; background:rgba(255,255,255,.05);
  border-radius:6px; overflow:hidden; position:relative; }
.path-fill  { height:100%; border-radius:6px; transition:width .9s; }
.path-pct   { font-size:11px; width:36px; text-align:right; font-weight:500; }

.top-finding-card {
  padding:.5rem .75rem; border-radius:8px; font-size:.82rem; font-weight:500;
  display:flex; justify-content:space-between; align-items:center;
}
.oracle-reasoning {
  background: rgba(0,0,0,.3); border-radius: 8px;
  border: 1px solid rgba(0,255,255,.15);
  padding: 1rem 1.25rem; font-size: .87rem; line-height: 1.6;
  max-height: 360px; overflow-y: auto;
}
.oracle-reasoning h2 { color:#00ffff; margin:.75rem 0 .25rem; font-size:1rem; }
.oracle-reasoning h3 { color:#adf; margin:.5rem 0 .2rem; font-size:.9rem; }
.oracle-reasoning hr { border-color:rgba(255,255,255,.1); margin:.75rem 0; }
.oracle-reasoning strong { color:#fff; }
.oracle-reasoning ul { padding-left:1.2rem; margin:.3rem 0; }
.oracle-reasoning li { margin:.15rem 0; }
.oracle-reasoning em  { color:#888; }
.oracle-reasoning p   { margin:.3rem 0; }

.oracle-progress-bar { height:3px; background:rgba(0,255,255,.1);
  border-radius:2px; overflow:hidden; margin:.25rem 0; }
.oracle-progress-fill { height:100%;
  background:linear-gradient(90deg,#00ffff,#4dff91);
  border-radius:2px; transition:width .4s; }

.model-badge {
  font-size:.75rem; padding:.25rem .6rem; border-radius:4px;
  background:rgba(0,255,255,.08); border:1px solid rgba(0,255,255,.2);
  color:#00ffff; display:inline-block; margin-bottom:.5rem;
}
*/

import { useState, useRef, useEffect, useCallback } from "react";

// Pathology color by severity
function pathColor(score) {
  if (score >= 0.6) return "#ff4d4d";
  if (score >= 0.4) return "#ff8c00";
  if (score >= 0.25) return "#ffd700";
  return "#4dff91";
}

// Minimal markdown renderer
function MD({ text }) {
  const html = text
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g,'<ul>$1</ul>')
    .replace(/^---$/gm,'<hr/>')
    .replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br/>');
  return <div className="oracle-reasoning"
    dangerouslySetInnerHTML={{__html:`<p>${html}</p>`}} />;
}

// Heatmap canvas overlay
function drawHeatmap(canvas, heatmap, imgEl) {
  if (!canvas || !heatmap || !imgEl) return;
  const displayW = imgEl.clientWidth || imgEl.naturalWidth || imgEl.width || 224;
  const displayH = imgEl.clientHeight || imgEl.naturalHeight || imgEl.height || 224;
  canvas.width = displayW;
  canvas.height = displayH;
  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;
  canvas.style.top = "0";
  canvas.style.left = "0";
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, displayW, displayH);
  const rows = heatmap.length, cols = heatmap[0].length;
  const cw = displayW / cols, ch = displayH / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = heatmap[r][c];
      if (v < 0.15) continue;
      const g = Math.round(255 * (1 - v));
      ctx.fillStyle = `rgba(255,${g},0,${v * 0.85})`;
      ctx.fillRect(c * cw + 2, r * ch + 2, Math.max(0, cw - 4), Math.max(0, ch - 4));
    }
  }
}

// ── Pathology Chart ────────────────────────────────────────────────
function PathologyChart({ scores }) {
  if (!scores) return null;
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12); // top 12 to avoid clutter
  return (
    <div>
      <div className="model-badge">
        TorchXRayVision DenseNet-121 — trained on NIH + CheXpert + MIMIC
      </div>
      <div className="pathology-chart">
        {sorted.map(([name, score]) => (
          <div key={name} className="path-row">
            <span className="path-name" title={name}>{name}</span>
            <div className="path-track">
              <div className="path-fill"
                style={{ width: `${Math.round(score * 100)}%`,
                         background: pathColor(score) }} />
            </div>
            <span className="path-pct"
              style={{ color: pathColor(score) }}>
              {Math.round(score * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top Findings Cards ─────────────────────────────────────────────
function TopFindings({ findings }) {
  if (!findings || findings.length === 0) return (
    <div style={{ fontSize: ".82rem", color: "#4dff91" }}>
      ✓ No significant pathologies detected
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {findings.map((f, i) => {
        const col = pathColor(f.score);
        return (
          <div key={i} className="top-finding-card"
            style={{ background: `${col}18`, border: `1px solid ${col}44` }}>
            <span style={{ color: col }}>{f.name}</span>
            <span style={{ color: col, fontWeight: 700 }}>
              {Math.round(f.score * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Risk Gauge ─────────────────────────────────────────────────────
function RiskGauge({ score, category }) {
  const cls = category === "HIGH" ? "high" : category === "MODERATE" ? "moderate" : "low";
  const col = cls === "high" ? "#ff4d4d" : cls === "moderate" ? "#ffd700" : "#4dff91";
  return (
    <div className="oracle-risk-gauge">
      <div className={`gauge-ring ${cls}`}>
        <span style={{ fontSize: "1.8rem", fontWeight: 700 }}>{score}</span>
        <span style={{ fontSize: ".7rem" }}>%</span>
      </div>
      <span style={{ fontWeight: 700, fontSize: "1rem", color: col }}>
        {category} RISK
      </span>
    </div>
  );
}

// ── Attention Bars ─────────────────────────────────────────────────
function AttentionBars({ attn }) {
  if (!attn) return null;
  const bars = [
    { label: "X-Ray",  val: attn.xray   ?? attn.vision, color: "#00ffff" },
    { label: "Notes",  val: attn.text,                  color: "#bd93f9" },
    { label: "Vitals", val: attn.vitals,                color: "#ffd700" },
  ];
  return (
    <div>
      <div style={{ fontSize:".75rem", color:"#888", marginBottom:".35rem" }}>
        Attention Weights
      </div>
      {bars.map(b => (
        <div key={b.label} className="attn-bar">
          <span style={{ width: 44, color: "#bbb", fontSize: ".78rem" }}>{b.label}</span>
          <div className="attn-track">
            <div className="attn-fill"
              style={{ width:`${Math.round((b.val||0)*100)}%`, background:b.color }} />
          </div>
          <span style={{ width:36, color:b.color, textAlign:"right", fontSize:".78rem" }}>
            {Math.round((b.val||0)*100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function OracleAssessment({ 
  token, 
  patients, 
  apiBase = "https://capstone.dpdns.org",
  wsBase = "wss://capstone.dpdns.org"
}) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [imageB64,        setImageB64]        = useState("");
  const [imagePreview,    setImagePreview]    = useState(null);
  const [clinicalNotes,   setClinicalNotes]   = useState("");
  const [dragging,        setDragging]        = useState(false);
  const [activeTab,       setActiveTab]       = useState("reasoning"); // reasoning | pathologies

  const [status,    setStatus]   = useState("idle");
  const [progress,  setProgress] = useState(0);
  const [thinkLog,  setThinkLog] = useState([]);
  const [result,    setResult]   = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imgRef    = useRef(null);
  const canvasRef = useRef(null);
  const thinkRef  = useRef(null);
  const wsRef     = useRef(null);
  const fileInput = useRef(null);

  useEffect(() => {
    if (thinkRef.current)
      thinkRef.current.scrollTop = thinkRef.current.scrollHeight;
  }, [thinkLog]);

  useEffect(() => {
    if (result?.heatmap && imageLoaded && imgRef.current && canvasRef.current) {
      drawHeatmap(canvasRef.current, result.heatmap, imgRef.current);
    }
  }, [result, imageLoaded]);

  const handleImage = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setImageB64(e.target.result);
      setImageLoaded(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleImage(e.dataTransfer.files[0]);
  }, [handleImage]);

  const startAssessment = async () => {
    if (!imageB64) return alert("Please upload an X-ray image first.");
    const patient = patients?.find(p => p.patient_id === selectedPatient);
    const vitals  = patient?.latest_vitals || {};

    setStatus("queued"); setProgress(0);
    setThinkLog([{ msg: "⏳ Starting Oracle assessment..." }]);
    setResult(null);

    try {
      const resp = await fetch(`${apiBase}/icu/ai/oracle/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
                   "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          patient_id:     selectedPatient || "DEMO",
          image_base64:   imageB64,
          clinical_notes: clinicalNotes,
          vitals,
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const { task_id } = await resp.json();

      const ws = new WebSocket(`${wsBase}/icu/ai/oracle/ws/${task_id}`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "thinking") {
          setStatus("processing");
          setProgress(msg.progress || 0);
          setThinkLog(prev => [...prev, { msg: msg.message }]);
        } else if (msg.type === "complete") {
          setStatus("complete"); setProgress(1);
          setThinkLog(prev => [...prev, { msg: "✅ Assessment complete!", done: true }]);
          setResult(msg);
          ws.close();
        } else if (msg.type === "error") {
          setStatus("error");
          setThinkLog(prev => [...prev, { msg: `❌ ${msg.message}` }]);
          ws.close();
        }
      };

      ws.onerror = () => {
        // Fallback: poll every 3s
        const poll = setInterval(async () => {
          try {
            const r = await fetch(`${apiBase}/icu/ai/oracle/task/${task_id}`,
              { headers: { Authorization: `Bearer ${token}` }});
            const d = await r.json();
            if (d.status === "complete") {
              clearInterval(poll);
              setStatus("complete"); setResult(d.result);
            }
          } catch {}
        }, 3000);
      };

    } catch (err) {
      setStatus("failed");
      setThinkLog(prev => [...prev, { msg: `❌ ${err.message}` }]);
    }
  };

  const reset = () => {
    wsRef.current?.close();
    setImageB64(""); setImagePreview(null); setClinicalNotes("");
    setImageLoaded(false);
    setStatus("idle"); setProgress(0); setThinkLog([]); setResult(null);
  };

  const isRunning = ["queued","processing"].includes(status);

  return (
    <div className="oracle-wrap">

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h2 style={{ margin:0, color:"#00ffff" }}>🔮 Multimodal AI Oracle</h2>
          <p style={{ margin:"4px 0 0", color:"#888", fontSize:".85rem" }}>
            TorchXRayVision DenseNet-121 + ClinicalBERT + Vitals Fusion
          </p>
        </div>
        {status !== "idle" && (
          <button onClick={reset}
            style={{ padding:"5px 12px", background:"transparent",
                     border:"1px solid rgba(255,255,255,.2)", borderRadius:6,
                     color:"#ccc", cursor:"pointer", fontSize:".85rem" }}>
            ↺ Reset
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="oracle-progress-bar">
          <div className="oracle-progress-fill"
            style={{ width:`${Math.round(progress*100)}%` }} />
        </div>
      )}

      <div className="oracle-grid">

        {/* ── LEFT: Input ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

          {/* Upload zone */}
          <div
            className={`oracle-upload-zone ${dragging ? "drag-over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
          >
            <input ref={fileInput} type="file" accept="image/*"
              style={{ display:"none" }}
              onChange={e => handleImage(e.target.files[0])} />
            {imagePreview ? (
              <div className="oracle-heatmap-wrap" style={{ position:"relative", display:"inline-block", borderRadius:8, overflow:"hidden", width:"100%" }}>
                <img ref={imgRef} src={imagePreview} alt="X-ray"
                  onLoad={() => setImageLoaded(true)}
                  style={{ width:"100%", height:"auto", maxHeight:240, borderRadius:8, display:"block" }} />
                {result?.heatmap && <canvas ref={canvasRef} style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", pointerEvents:"none", opacity:0.85, borderRadius:8 }} />}
              </div>
            ) : (
              <div>
                <div style={{ fontSize:"2.5rem" }}>🩻</div>
                <div style={{ color:"#00ffff", fontWeight:600 }}>Drop X-ray here</div>
                <div style={{ color:"#666", fontSize:".8rem" }}>JPG / PNG — click or drag</div>
                <button
                  onClick={(e) => { e.stopPropagation(); fileInput.current?.click(); }}
                  style={{
                    marginTop: "1rem",
                    padding: "0.6rem 1.2rem",
                    background: "rgba(0,255,255,.15)",
                    color: "#00ffff",
                    border: "1px solid rgba(0,255,255,.4)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: ".9rem",
                    fontWeight: 500,
                    transition: "all .2s"
                  }}
                >
                  📁 Upload Image
                </button>
              </div>
            )}
          </div>

          {/* Patient selector */}
          <select value={selectedPatient}
            onChange={e => setSelectedPatient(e.target.value)}
            style={{ width:"100%", padding:".5rem",
                     background:"rgba(0,0,0,.4)", color:"#fff",
                     border:"1px solid rgba(0,255,255,.2)", borderRadius:6 }}>
            <option value="">— No patient selected (demo) —</option>
            {(patients||[]).map(p => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.patient_id} — {p.name || "Unknown"}
              </option>
            ))}
          </select>

          {/* Clinical notes */}
          <textarea value={clinicalNotes}
            onChange={e => setClinicalNotes(e.target.value)}
            placeholder="Clinical notes: e.g. patient has high fever, SpO2 dropping, history of COPD, persistent cough..."
            rows={4}
            style={{ width:"100%", padding:".65rem",
                     background:"rgba(0,0,0,.3)", color:"#fff",
                     border:"1px solid rgba(0,255,255,.2)",
                     borderRadius:6, resize:"vertical",
                     fontSize:".87rem", boxSizing:"border-box" }} />

          {/* Run button */}
          <button onClick={startAssessment} disabled={!imageB64 || isRunning}
            style={{
              padding:".8rem", fontSize:"1rem", fontWeight:600, cursor:"pointer",
              background: !imageB64 || isRunning ? "rgba(0,255,255,.05)" : "rgba(0,255,255,.12)",
              color: !imageB64 || isRunning ? "#555" : "#00ffff",
              border: "1px solid rgba(0,255,255,.3)", borderRadius:8,
              opacity: !imageB64 || isRunning ? .6 : 1, transition:"all .2s",
            }}>
            {status === "queued"     ? "⏳ Queuing..." :
             status === "processing" ? "🧠 Oracle thinking..." :
                                       "⚡ Run Oracle Assessment"}
          </button>
        </div>

        {/* ── RIGHT: Output ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

          {/* Thinking log */}
          {thinkLog.length > 0 && (
            <div className="oracle-thinking" ref={thinkRef}>
              {thinkLog.map((t, i) => (
                <p key={i} className={t.done ? "done" : ""}>{t.msg}</p>
              ))}
            </div>
          )}

          {/* Result */}
          {result && (
            <>
              {/* Risk + attention */}
              <div style={{
                background:"rgba(0,0,0,.3)", borderRadius:12,
                border:"1px solid rgba(0,255,255,.15)",
                padding:"1.25rem", display:"flex",
                gap:"1.5rem", alignItems:"flex-start", flexWrap:"wrap",
              }}>
                <RiskGauge score={result.risk_score} category={result.risk_category} />
                <div style={{ flex:1, minWidth:180 }}>
                  <AttentionBars attn={result.attention} />
                </div>
              </div>

              {/* Top findings */}
              {result.top_findings?.length > 0 && (
                <div style={{
                  background:"rgba(0,0,0,.25)", borderRadius:10,
                  border:"1px solid rgba(255,255,255,.08)", padding:"1rem",
                }}>
                  <div style={{ fontSize:".78rem", color:"#888",
                                textTransform:"uppercase", letterSpacing:".06em",
                                marginBottom:".5rem" }}>
                    Top Detected Pathologies
                  </div>
                  <TopFindings findings={result.top_findings} />
                </div>
              )}

              {/* Tab: Reasoning | Pathologies */}
              <div style={{ display:"flex", gap:4, marginBottom:"-8px" }}>
                {["reasoning","pathologies"].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{
                      padding:"5px 14px", border:"none", cursor:"pointer",
                      borderRadius:"6px 6px 0 0", fontSize:".83rem", fontWeight:600,
                      background: activeTab===tab ? "rgba(0,255,255,.12)" : "transparent",
                      color: activeTab===tab ? "#00ffff" : "#666",
                      borderBottom: activeTab===tab ? "2px solid #00ffff" : "2px solid transparent",
                    }}>
                    {tab === "reasoning" ? "📋 Reasoning" : "📊 All Pathologies"}
                  </button>
                ))}
              </div>

              {activeTab === "reasoning" && <MD text={result.reasoning} />}

              {activeTab === "pathologies" && (
                <div style={{
                  background:"rgba(0,0,0,.3)", borderRadius:"0 8px 8px 8px",
                  border:"1px solid rgba(0,255,255,.15)", padding:"1rem",
                  maxHeight:360, overflowY:"auto",
                }}>
                  <PathologyChart scores={result.pathology_scores} />
                </div>
              )}

              {/* Heatmap note */}
              {result.heatmap && imagePreview && (
                <div style={{
                  fontSize:".78rem", color:"#888",
                  background:"rgba(255,100,0,.06)",
                  border:"1px solid rgba(255,100,0,.2)",
                  borderRadius:6, padding:".5rem .75rem",
                }}>
                  🗺️ Grad-CAM heatmap overlaid on X-ray — orange/red = AI attention regions
                  (peak: {Math.round(result.heatmap_peak * 100)}%)
                </div>
              )}
            </>
          )}

          {/* Idle placeholder */}
          {status === "idle" && (
            <div style={{
              padding:"2.5rem", textAlign:"center", color:"#555",
              border:"1px solid rgba(255,255,255,.05)", borderRadius:12,
            }}>
              <div style={{ fontSize:"3rem", marginBottom:".5rem" }}>🔮</div>
              <div style={{ marginBottom:".35rem" }}>Upload an X-ray to start</div>
              <div style={{ fontSize:".78rem", color:"#444", lineHeight:1.5 }}>
                DenseNet-121 detects 18 pathologies<br/>
                Trained on 500,000+ real chest X-rays
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
