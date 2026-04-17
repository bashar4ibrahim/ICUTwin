// ExportMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import './ExportMenu.css';

/**
 * ExportMenu
 * Props:
 *  - onExportPDF: () => void
 *  - onExportPrint: () => void
 *  - onExportJSON: (data) => void
 *  - onCopyClipboard: () => void
 *  - reportData: object (passed to JSON export)
 *  - disabled: bool
 */
export default function ExportMenu({
  onExportPDF,
  onExportPrint,
  onExportJSON,
  onCopyClipboard,
  reportData,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopy = () => {
    if (onCopyClipboard) onCopyClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  const handleJSON = () => {
    if (onExportJSON && reportData) {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-report-${reportData?.patient?.patient_id || 'data'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setOpen(false);
  };

  const items = [
    { icon: '🖨️', label: 'Print Report', sub: 'Print-friendly layout', action: () => { onExportPrint?.(); setOpen(false); } },
    { icon: '📋', label: copied ? 'Copied!' : 'Copy to Clipboard', sub: 'Plain text summary', action: handleCopy },
    { icon: '{ }', label: 'Export as JSON', sub: 'Structured data export', action: handleJSON, mono: true },
  ];

  return (
    <div className="export-menu" ref={ref}>
      <button
        className={`em-trigger ${open ? 'em-trigger--open' : ''}`}
        onClick={() => setOpen(v => !v)}
        disabled={disabled}
        title="Export options"
      >
        <span>Export</span>
        <svg className={`em-chevron ${open ? 'em-chevron--up' : ''}`} viewBox="0 0 12 8" fill="none">
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="em-dropdown">
          <div className="em-header">Export Options</div>
          {items.map((item) => (
            <button key={item.label} className="em-item" onClick={item.action}>
              <span className={`em-item-icon ${item.mono ? 'em-item-icon--mono' : ''}`}>
                {item.icon}
              </span>
              <span className="em-item-content">
                <span className="em-item-label">{item.label}</span>
                <span className="em-item-sub">{item.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}