// GenerateReportButton.jsx
import React, { useState } from 'react';
import './GenerateReportButton.css';

/**
 * GenerateReportButton
 * Props:
 *  - patient: patient object (required for single mode)
 *  - selectedPatients: array of patient objects (for multi mode)
 *  - mode: 'single' | 'multi' | 'high-risk'
 *  - onGenerate: (patients, mode) => void
 *  - variant: 'primary' | 'ghost' | 'inline'
 *  - label: optional custom label
 */
export default function GenerateReportButton({
  patient,
  selectedPatients = [],
  mode = 'single',
  onGenerate,
  variant = 'primary',
  label,
}) {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (!onGenerate) return;
    if (mode === 'single' && patient) {
      onGenerate([patient], 'single');
    } else if (mode === 'multi') {
      onGenerate(selectedPatients, 'multi');
    } else if (mode === 'high-risk') {
      onGenerate(selectedPatients.filter(p => p.status === 'critical'), 'high-risk');
    }
  };

  const getLabel = () => {
    if (label) return label;
    if (mode === 'multi') return `Generate ${selectedPatients.length} Reports`;
    if (mode === 'high-risk') return 'Report: High Risk';
    return 'Generate Report';
  };

  return (
    <button
      className={`grb-btn grb-${variant}`}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Generate Clinical Report"
    >
      <span className={`grb-icon ${hovered ? 'grb-icon--spin' : ''}`}>📄</span>
      <span className="grb-label">{getLabel()}</span>
      <span className="grb-shine" />
    </button>
  );
}