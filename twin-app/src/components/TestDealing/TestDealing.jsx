import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Animated Counter Component (unchanged)
const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count}</span>;
};

// Cinematic Header (unchanged except for motion import now working)
const CinematicHeader = () => {
  const phrases = [
    "ICU Digital Twin",
    "AI-Powered Intelligence",
    "Real-Time Monitoring",
    "Predictive Analytics",
    "Secure Clinical Command",
  ];
  
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;
    const currentPhrase = phrases[phraseIndex];
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentPhrase.length) {
          setDisplayText(currentPhrase.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          if (phraseIndex === phrases.length - 1) setIsComplete(true);
          else setIsDeleting(true);
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(currentPhrase.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => prev + 1);
        }
      }
    }, isDeleting ? 50 : 100);
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex, isComplete, phrases]);

  return (
    <motion.div 
      style={styles.headerContainer}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div 
        style={styles.headerBadge}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <span style={styles.headerBadgeDot} />
        SAFWA AI SYSTEM
        <span style={styles.headerBadgeGlow} />
      </motion.div>
      
      <h1 style={styles.headerTitle}>
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Welcome to
        </motion.span>{" "}
        <motion.span 
          style={styles.headerHighlight}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {displayText || phrases[0]}
        </motion.span>
        {!isComplete && <span style={styles.headerCursor}>|</span>}
      </h1>
      
      <motion.p 
        style={styles.headerSubtitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        Experience the future of critical care with real‑time telemetry, predictive risk scores,
        and AI‑assisted clinical workflows.
      </motion.p>

      <motion.div 
        style={styles.headerAccent}
        initial={{ width: 0 }}
        animate={{ width: "180px" }}
        transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
      />
    </motion.div>
  );
};

// Premium Metric Widget – Fixed SVG circle attributes
const MetricWidget = ({ label, value, unit, icon, color, progress, onClick, index }) => {
  const [hovered, setHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 25 });
  const springY = useSpring(y, { stiffness: 300, damping: 25 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); setHovered(false); };

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      style={{
        ...styles.widget,
        rotateX,
        rotateY,
        transformPerspective: 800,
        borderColor: hovered ? color : "rgba(255,255,255,0.3)",
        boxShadow: hovered
          ? `0 30px 50px -15px ${color}40, 0 0 0 2px ${color}40, inset 0 1px 0 rgba(255,255,255,0.8)`
          : styles.widget.boxShadow,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 + index * 0.06, duration: 0.5, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
    >
      <div style={{ ...styles.glassOverlay, opacity: hovered ? 1 : 0.6 }} />
      
      <div
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: 30,
          background: `linear-gradient(135deg, ${color}60, transparent 60%)`,
          opacity: hovered ? 0.8 : 0,
          transition: "opacity 0.3s",
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: 3,
          borderRadius: 3,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          boxShadow: `0 0 15px ${color}`,
          opacity: hovered ? 1 : 0.3,
          transition: "opacity 0.3s",
        }}
      />

      <div style={styles.widgetTop}>
        <div
          style={{
            ...styles.widgetIconWrapper,
            background: `linear-gradient(145deg, ${color}20, ${color}08)`,
            boxShadow: `inset 0 2px 6px rgba(255,255,255,0.6), 0 8px 16px ${color}30, 0 0 0 1px ${color}40`,
          }}
        >
          <span style={{ ...styles.widgetIcon, color }}>{icon}</span>
        </div>
        <div style={styles.widgetValue}>
          <AnimatedCounter value={parseInt(value) || 0} />
          {unit && <span style={styles.widgetUnit}>{unit}</span>}
        </div>
      </div>
      <div style={styles.widgetLabel}>{label}</div>
      <div style={styles.widgetProgress}>
        <svg width="56" height="56" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 4px 8px ${color}60)` }}>
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeDasharray={circumference}
            style={{ filter: `drop-shadow(0 0 12px ${color})` }}
          />
        </svg>
        <span style={{ ...styles.progressText, color: hovered ? color : "#0f172a" }}>{progress}%</span>
      </div>
    </motion.div>
  );
};

const SYSTEM_PAGES = [
  { id: "dashboard", icon: "⬡", label: "Workload", value: "68", unit: "%", progress: 68, color: "#0ea5e9" },
  { id: "patients", icon: "👤", label: "ICU Patients", value: "12", unit: "", progress: 75, color: "#14b8a6" },
  { id: "vitals", icon: "💓", label: "Vitals Monitored", value: "8", unit: "", progress: 80, color: "#ef4444" },
  { id: "resources", icon: "🛏", label: "Beds Occupied", value: "9", unit: "/12", progress: 75, color: "#10b981" },
  { id: "ai", icon: "🤖", label: "AI Predictions", value: "24", unit: "", progress: 82, color: "#8b5cf6" },
  { id: "chatbot", icon: "💬", label: "Queries Today", value: "38", unit: "", progress: 63, color: "#0ea5e9" },
];

export default function TestDealing() {
  const navigate = useNavigate();
  const handlePageClick = (pageId) => navigate("/", { replace: true });

  useEffect(() => {
    if (!document.querySelector('script[src*="spline-viewer"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://unpkg.com/@splinetool/viewer@1.12.85/build/spline-viewer.js";
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div style={styles.root}>
      <div style={styles.backgroundBase} />
      <div style={styles.animatedGrid} />
      <div style={styles.noiseTexture} />
      <div style={styles.blobTeal} />
      <div style={styles.blobBlue} />
      <div style={styles.blobPurple} />
      <div style={styles.blobAmber} />

      <div style={styles.mainContent}>
        <CinematicHeader />
        <div style={styles.widgetGrid}>
          {SYSTEM_PAGES.map((page, idx) => (
            <MetricWidget
              key={page.id}
              icon={page.icon}
              label={page.label}
              value={page.value}
              unit={page.unit}
              color={page.color}
              progress={page.progress}
              onClick={() => handlePageClick(page.id)}
              index={idx}
            />
          ))}
        </div>
        <motion.div 
          style={styles.footerNote}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          ⚡ ICU Digital Twin v3.0 · Secure Clinical Access
        </motion.div>
      </div>

      <div style={styles.splineCorner}>
        <div style={{ width: "100%", height: "100%", background: "transparent", position: "relative" }}>
          <spline-viewer
            url="https://prod.spline.design/gIYZkSHFN9QfNh6F/scene.splinecode"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { height: 100%; width: 100%; overflow: hidden; }
        @keyframes blobFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-40px) scale(1.06); }
        }
        @keyframes gridDrift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 12px #0ea5e9; }
          50% { box-shadow: 0 0 20px #0ea5e9, 0 0 30px #14b8a6; }
        }
      `}</style>
    </div>
  );
}

// Styles (unchanged from original)
const styles = {
  root: { height: "100vh", width: "100vw", fontFamily: "'DM Sans', sans-serif", color: "#0f172a", position: "relative", overflow: "hidden" },
  backgroundBase: { position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 40%, #e8f4ff 0%, #f4f9fe 50%, #fafcff 100%)", zIndex: 0 },
  animatedGrid: { position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(14,165,233,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.03) 1px, transparent 1px)`, backgroundSize: "60px 60px", animation: "gridDrift 30s linear infinite", zIndex: 1, opacity: 0.6 },
  noiseTexture: { position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, zIndex: 2, pointerEvents: "none" },
  blobTeal: { position: "absolute", top: "-8%", right: "5%", width: "550px", height: "550px", borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 65%)", animation: "blobFloat 14s ease-in-out infinite", pointerEvents: "none", zIndex: 3, filter: "blur(40px)" },
  blobBlue: { position: "absolute", bottom: "-10%", left: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 65%)", animation: "blobFloat 16s ease-in-out infinite reverse", pointerEvents: "none", zIndex: 3, filter: "blur(45px)" },
  blobPurple: { position: "absolute", top: "40%", left: "15%", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)", animation: "blobFloat 18s ease-in-out infinite alternate", pointerEvents: "none", zIndex: 3, filter: "blur(35px)" },
  blobAmber: { position: "absolute", top: "60%", right: "20%", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 65%)", animation: "blobFloat 12s ease-in-out infinite alternate-reverse", pointerEvents: "none", zIndex: 3, filter: "blur(30px)" },
  mainContent: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: "36px 48px", overflowY: "auto", zIndex: 10, display: "flex", flexDirection: "column" },
  headerContainer: { marginBottom: "40px", flexShrink: 0, position: "relative" },
  headerBadge: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 18px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "40px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0ea5e9", marginBottom: "20px", boxShadow: "inset 0 1px 3px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.04)", position: "relative" },
  headerBadgeDot: { width: "10px", height: "10px", borderRadius: "50%", background: "#0ea5e9", animation: "badgePulse 2s infinite" },
  headerBadgeGlow: { position: "absolute", inset: -2, borderRadius: 42, background: "linear-gradient(135deg, #0ea5e940, transparent)", opacity: 0.3, filter: "blur(4px)", zIndex: -1 },
  headerTitle: { fontFamily: "'Syne', sans-serif", fontSize: "clamp(2.8rem, 5vw, 4.2rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: "20px", color: "#0f172a", maxWidth: "850px", letterSpacing: "-0.02em" },
  headerHighlight: { background: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 50%, #8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", textShadow: "0 2px 20px rgba(14,165,233,0.15)" },
  headerCursor: { display: "inline-block", width: "4px", marginLeft: "6px", background: "#0ea5e9", animation: "cursorBlink 1s infinite", borderRadius: "2px" },
  headerSubtitle: { fontSize: "1.15rem", lineHeight: 1.7, color: "#475569", maxWidth: "650px", marginBottom: "28px", fontWeight: 400 },
  headerAccent: { height: "4px", background: "linear-gradient(90deg, #0ea5e9, #14b8a6, #8b5cf6, transparent)", borderRadius: "4px", boxShadow: "0 0 20px #0ea5e980" },
  widgetGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px", marginBottom: "28px", flex: 1, alignContent: "start" },
  widget: { background: "rgba(255,255,255,0.4)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: "36px", padding: "26px", cursor: "pointer", transition: "box-shadow 0.3s, border-color 0.3s", position: "relative", boxShadow: `0 12px 24px -8px rgba(0,0,0,0.06), 0 2px 6px -2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.9)` },
  glassOverlay: { position: "absolute", inset: 0, borderRadius: 36, background: "linear-gradient(145deg, rgba(255,255,255,0.5), transparent)", pointerEvents: "none", transition: "opacity 0.3s" },
  widgetTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", position: "relative", zIndex: 2 },
  widgetIconWrapper: { width: "56px", height: "56px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center" },
  widgetIcon: { fontSize: "28px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" },
  widgetValue: { fontSize: "38px", fontWeight: 800, color: "#0f172a", lineHeight: 1, letterSpacing: "-0.02em" },
  widgetUnit: { fontSize: "15px", fontWeight: 400, color: "#64748b", marginLeft: "4px" },
  widgetLabel: { fontSize: "16px", fontWeight: 500, color: "#334155", marginBottom: "22px", position: "relative", zIndex: 2 },
  widgetProgress: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "14px", position: "relative", zIndex: 2 },
  progressText: { fontSize: "17px", fontWeight: 700, transition: "color 0.2s" },
  footerNote: { fontSize: "12px", color: "#94a3b8", textAlign: "center", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,0.05)", flexShrink: 0 },
  splineCorner: { position: "absolute", bottom: "28px", right: "28px", width: "320px", height: "320px", zIndex: 15, background: "transparent", pointerEvents: "none" },
};
