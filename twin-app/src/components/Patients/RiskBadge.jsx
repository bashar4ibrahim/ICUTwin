// RiskBadge.jsx
import React from 'react';
import './RiskBadge.css';

const RISK_CONFIG = {
  critical: { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🔴', pulse: true },
  high:     { label: 'HIGH',     color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: '🟠', pulse: false },
  medium:   { label: 'MEDIUM',   color: '#eab308', bg: 'rgba(234,179,8,0.12)',  icon: '🟡', pulse: false },
  low:      { label: 'LOW',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: '🟢', pulse: false },
  stable:   { label: 'STABLE',   color: '#14b8a6', bg: 'rgba(20,184,166,0.12)', icon: '✅', pulse: false },
};

/**
 * RiskBadge
 * Props:
 *  - level: 'critical' | 'high' | 'medium' | 'low' | 'stable'
 *  - score: numeric 0-100 (optional)
 *  - size: 'sm' | 'md' | 'lg'
 *  - showScore: bool
 */
export default function RiskBadge({ level = 'stable', score, size = 'md', showScore = true }) {
  const cfg = RISK_CONFIG[level?.toLowerCase()] || RISK_CONFIG.stable;

  return (
    <div
      className={`risk-badge risk-badge--${size} ${cfg.pulse ? 'risk-badge--pulse' : ''}`}
      style={{ '--rb-color': cfg.color, '--rb-bg': cfg.bg }}
    >
      <span className="rb-dot" />
      <span className="rb-label">{cfg.label}</span>
      {showScore && score != null && (
        <span className="rb-score">{score}%</span>
      )}
    </div>
  );
}