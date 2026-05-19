
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import gsap from 'gsap';
import './Login.css';
import { API_BASE, apiFetch } from '../../app/shared';
import ErrorBanner from '../ErrorBanner/ErrorBanner';
import ParticleField from '../PreLogin/ParticleField';

/* \u2500\u2500\u2500 SVG Icons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="input-icon">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="input-icon">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconEye = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    {open ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* \u2500\u2500\u2500 Tilt Card Hook \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
function useTilt(strength = 8) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [strength, -strength]), { stiffness: 180, damping: 28 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-strength, strength]), { stiffness: 180, damping: 28 });

  const onMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mx, my]);

  const onMouseLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}

/* \u2500\u2500\u2500 Magnetic Button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
function MagneticBtn({ children, className, style, disabled, type, onClick }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 22 });
  const sy = useSpring(y, { stiffness: 280, damping: 22 });

  const handleMouseMove = (e) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.28);
    y.set((e.clientY - cy) * 0.28);

    // Update glow position for radial gradient
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((e.clientY - rect.top) / rect.height) * 100;
    ref.current.style.setProperty('--mx', `${relX}%`);
    ref.current.style.setProperty('--my', `${relY}%`);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      className={className}
      style={{ x: sx, y: sy, ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
    >
      <span className="btn-glow" />
      {children}
    </motion.button>
  );
}

/* \u2500\u2500\u2500 Animated Counter \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
function AnimatedKPI({ value, label, delay }) {
  const [displayed, setDisplayed] = useState('');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!entered) return;
    const num = parseFloat(value);
    if (!isNaN(num) && value.match(/^\d/)) {
      let start = 0;
      const end = num;
      const duration = 900;
      const step = (end / duration) * 16;
      const interval = setInterval(() => {
        start = Math.min(start + step, end);
        setDisplayed(start === end ? value : Math.floor(start).toString());
        if (start >= end) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    } else {
      setDisplayed(value);
    }
  }, [entered, value]);

  return (
    <motion.div
      className="login-kpi"
      initial={{ scale: 0.78, opacity: 0, y: 12 }}
      animate={entered ? { scale: 1, opacity: 1, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay }}
      whileHover={{
        scale: 1.05,
        y: -4,
        boxShadow: '0 16px 40px rgba(99, 102, 241, 0.22)',
        borderColor: 'rgba(99, 102, 241, 0.38)',
      }}
    >
      <div className="login-kpi-value">{displayed || value}</div>
      <div className="login-kpi-label">{label}</div>
    </motion.div>
  );
}

/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   MAIN LOGIN COMPONENT
   \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
function Login({ onLogin }) {
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [authSuccess, setAuthSuccess]   = useState(false);

  const containerRef = useRef(null);
  const heroRef      = useRef(null);
  const cardRef      = useRef(null);
  const orbRef       = useRef(null);

  const heroTilt = useTilt(5);
  const cardTilt = useTilt(6);

  /* \u2500\u2500 Password strength \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  useEffect(() => {
    let score = 0;
    if (password.length > 5)  score += 33;
    if (password.length > 9)  score += 33;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 34;
    setPwStrength(score);
  }, [password]);

  /* \u2500\u2500 GSAP Entrance \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero slide in
      gsap.fromTo(heroRef.current,
        { x: -80, opacity: 0, filter: 'blur(12px)' },
        { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.0, ease: 'expo.out', delay: 0.1 }
      );
      // Card slide in
      gsap.fromTo(cardRef.current,
        { x: 80, opacity: 0, filter: 'blur(12px)' },
        { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.0, ease: 'expo.out', delay: 0.22 }
      );
      // Form children stagger
      gsap.fromTo('.login-form > *',
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.09, delay: 0.65, ease: 'power3.out' }
      );
      // KPI counter stagger handled by AnimatedKPI
    }, containerRef);
    return () => ctx.revert();
  }, []);

  /* \u2500\u2500 Submit \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Pulse the card border
    gsap.to(cardRef.current, {
      boxShadow: '0 0 0 4px rgba(99,102,241,0.3), 0 32px 80px rgba(99,102,241,0.25)',
      duration: 0.25,
      yoyo: true,
      repeat: 1,
    });

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      localStorage.setItem('icu_token', data.access_token);

      // Success animation
      setAuthSuccess(true);
      gsap.to(cardRef.current, {
        scale: 1.015,
        boxShadow: '0 0 0 4px rgba(16,185,129,0.4), 0 40px 100px rgba(16,185,129,0.22)',
        duration: 0.4,
        ease: 'back.out(1.5)',
        onComplete: async () => {
          const me = await apiFetch('/auth/me');
          onLogin({ ...me, token: data.access_token });
        }
      });
    } catch (err) {
      setError('ACCESS DENIED \u2014 ' + err.message);
      // Shake card
      gsap.fromTo(cardRef.current,
        { x: 0 },
        { x: 8, duration: 0.08, repeat: 5, yoyo: true, ease: 'power1.inOut',
          onComplete: () => gsap.set(cardRef.current, { x: 0 }) }
      );
      // Flash error tint
      gsap.to(cardRef.current, {
        boxShadow: '0 0 0 4px rgba(239,68,68,0.3), 0 32px 80px rgba(239,68,68,0.15)',
        duration: 0.2, yoyo: true, repeat: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const loginMetrics = [
    { value: '7',        label: 'Core Modules'     },
    { value: 'REST+WS',  label: 'Live Integrations' },
    { value: 'AI+OPS',   label: 'Unified Insight'  },
  ];

  /* \u2500\u2500\u2500 Render \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  return (
    <div className="login-screen" ref={containerRef}>
      <ParticleField />

      {/* Floating ambient particles */}
      <div className="login-particle login-particle-1" />
      <div className="login-particle login-particle-2" />
      <div className="login-particle login-particle-3" />
      <div className="login-particle login-particle-4" />

      <div className="login-shell">

        {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 HERO PANEL \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
        <motion.section
          className="login-hero"
          ref={(el) => { heroRef.current = el; heroTilt.ref.current = el; }}
          onMouseMove={heroTilt.onMouseMove}
          onMouseLeave={heroTilt.onMouseLeave}
          style={{
            rotateX: heroTilt.rotateX,
            rotateY: heroTilt.rotateY,
            transformPerspective: 900,
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="login-hero-copy">

            {/* Eyebrow */}
            <motion.div
              className="login-eyebrow"
              initial={{ opacity: 0, y: -10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 240, damping: 20 }}
            >
              <span className="live-dot" />
              Future ICU Command
            </motion.div>

            {/* Orb */}
            <motion.div
              className="login-orb"
              ref={orbRef}
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 220, damping: 16 }}
              whileHover={{ scale: 1.1, rotate: 6 }}
            >
              AI
            </motion.div>

            {/* Headline */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                ICU{' '}
                <span className="hero-gradient-text">Digital</span>
                <br />
                <span className="hero-gradient-text">Twin</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.68, duration: 0.6 }}
              >
                Real-time telemetry, predictive intelligence, operational simulation,
                and cyber-clinical awareness in one premium control surface.
              </motion.p>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="login-kpi-grid">
            {loginMetrics.map((item, i) => (
              <AnimatedKPI
                key={item.label}
                value={item.value}
                label={item.label}
                delay={0.78 + i * 0.12}
              />
            ))}
          </div>

          {/* Hero Note */}
          <motion.div
            className="login-hero-note"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.55 }}
            whileHover={{ y: -2 }}
          >
            Designed for fast clinical decisions with layered risk signals, streaming
            vitals, AI-assisted workflows, resource simulation, and security observability.
          </motion.div>
        </motion.section>

        {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 FORM CARD \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
        <motion.section
          className={`login-card${authSuccess ? ' auth-success' : ''}`}
          ref={(el) => { cardRef.current = el; cardTilt.ref.current = el; }}
          onMouseMove={cardTilt.onMouseMove}
          onMouseLeave={cardTilt.onMouseLeave}
          style={{
            rotateX: cardTilt.rotateX,
            rotateY: cardTilt.rotateY,
            transformPerspective: 900,
            transformStyle: 'preserve-3d',
          }}
        >

          {/* Badge */}
          <motion.div
            className="login-badge"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 220, damping: 20 }}
          >
            <span className="live-dot" />
            <IconShield />
            Secure Clinical Access
          </motion.div>

          {/* Title */}
          <motion.h2
            className="login-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            Initialize{' '}
            <span className="title-accent">Session</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            className="login-copy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68, duration: 0.5 }}
          >
            Authenticate to access the full digital twin workspace and live clinical
            intelligence pipeline.
          </motion.p>

          {/* \u2500\u2500 FORM \u2500\u2500 */}
          <form onSubmit={handleSubmit} className="login-form">

            {/* Username */}
            <div className="form-group">
              <motion.label
                className="form-label"
                animate={{ color: focusedField === 'user' ? '#6366f1' : '#475569' }}
                transition={{ duration: 0.2 }}
              >
                Username
              </motion.label>
              <div className="input-wrap input-icon-wrap">
                <IconUser />
                <input
                  type="text"
                  className="input-field"
                  placeholder="dr.ahmad"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('user')}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <motion.label
                className="form-label"
                animate={{ color: focusedField === 'pass' ? '#6366f1' : '#475569' }}
                transition={{ duration: 0.2 }}
              >
                Password
              </motion.label>
              <div className="input-wrap input-icon-wrap" style={{ position: 'relative' }}>
                <IconLock />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                {/* Toggle visibility */}
                <motion.button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', padding: 4, display: 'flex',
                    alignItems: 'center', zIndex: 4,
                  }}
                  whileHover={{ color: '#6366f1', scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  tabIndex={-1}
                >
                  <IconEye open={showPass} />
                </motion.button>
              </div>

              {/* Password strength bar */}
              <AnimatePresence>
                {password.length > 0 && (
                  <motion.div
                    className="pw-strength-bar"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    style={{ transformOrigin: 'left' }}
                  >
                    <motion.div
                      className="pw-strength-fill"
                      animate={{ width: `${pwStrength}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ErrorBanner msg={error} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit CTA */}
            <MagneticBtn
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div className="spinner" />
                    Authenticating\u2026
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    Initialize Session
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <IconArrow />
                    </motion.span>
                  </motion.span>
                )}
              </AnimatePresence>
            </MagneticBtn>
          </form>

          {/* Divider */}
          <div className="login-divider" style={{ marginTop: 16 }}>
            <span>demo credentials</span>
          </div>

          {/* Demo Box */}
          <motion.div
            className="login-demo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            whileHover={{ y: -2 }}
            onClick={() => { setUsername('dr.ahmad'); setPassword('password123'); }}
            style={{ cursor: 'pointer' }}
            title="Click to auto-fill"
          >
            <strong>dr.ahmad</strong> / <strong>password123</strong>
            {'  \u00b7  '}
            <strong>admin</strong> / <strong>admin123</strong>
            <span style={{ marginLeft: 6, opacity: 0.55, fontSize: '0.68rem' }}>\u2190 click to fill</span>
          </motion.div>

        </motion.section>
      </div>
    </div>
  );
}

export default Login;
