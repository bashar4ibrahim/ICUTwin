// ReportSection.jsx
import React, { useState } from 'react';
import './ReportSection.css';

/**
 * ReportSection
 * A collapsible, titled section for the report preview.
 * Props:
 *  - title: string
 *  - icon: string (emoji or char)
 *  - children: ReactNode
 *  - accent: 'default' | 'warning' | 'danger' | 'success' | 'info'
 *  - collapsible: bool
 *  - defaultOpen: bool
 *  - tag: optional JSX (extra badge in the header)
 */
export default function ReportSection({
  title,
  icon,
  children,
  accent = 'default',
  collapsible = false,
  defaultOpen = true,
  tag,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rs-section rs-section--${accent}`}>
      <div
        className={`rs-header ${collapsible ? 'rs-header--clickable' : ''}`}
        onClick={collapsible ? () => setOpen(v => !v) : undefined}
      >
        <div className="rs-title-group">
          {icon && <span className="rs-icon">{icon}</span>}
          <span className="rs-title">{title}</span>
          {tag && <span className="rs-tag">{tag}</span>}
        </div>
        {collapsible && (
          <svg className={`rs-chevron ${open ? 'rs-chevron--open' : ''}`} viewBox="0 0 12 8" fill="none">
            <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </div>
      {(!collapsible || open) && (
        <div className="rs-body">{children}</div>
      )}
    </div>
  );
}

/**
 * ReportRow — a labeled data row inside a section
 */
export function ReportRow({ label, value, highlight, trend }) {
  const trendIcon = trend === 'improving' ? '↑' : trend === 'worsening' ? '↓' : trend === 'stable' ? '→' : null;
  const trendClass = trend === 'improving' ? 'rr-trend--up' : trend === 'worsening' ? 'rr-trend--down' : 'rr-trend--flat';

  return (
    <div className={`rr-row ${highlight ? 'rr-row--highlight' : ''}`}>
      <span className="rr-label">{label}</span>
      <span className="rr-value">
        {value ?? '—'}
        {trendIcon && <span className={`rr-trend ${trendClass}`}>{trendIcon}</span>}
      </span>
    </div>
  );
}

/**
 * AlertChip — inline colored alert tag
 */
export function AlertChip({ label, severity = 'warning' }) {
  return <span className={`alert-chip alert-chip--${severity}`}>{label}</span>;
}