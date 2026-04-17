import React from 'react';

// Simple parser to detect tables or structured data in text.
// In a real app, you'd have a more robust system, but for demo we check for markdown-like tables or bullet lists.
const DynamicContentRenderer = ({ content }) => {
  if (!content) return null;

  // Check if content contains a markdown table (simple detection)
  if (content.includes('|') && content.includes('---')) {
    const lines = content.split('\n').filter(l => l.trim());
    const tableLines = lines.filter(l => l.includes('|'));
    if (tableLines.length >= 2) {
      const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean);
      const rows = tableLines.slice(2).map(line => line.split('|').map(cell => cell.trim()).filter(Boolean));
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0' }}>
          <thead>
            <tr>{headers.map((h, i) => <th key={i} style={{ borderBottom: '1px solid var(--border-default)', padding: '8px', textAlign: 'left' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)' }}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      );
    }
  }

  // Check for bullet list items
  if (content.includes('\n- ')) {
    const items = content.split('\n- ').filter(Boolean);
    if (items.length > 1) {
      return (
        <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
          {items.map((item, i) => <li key={i}>{item.replace(/^- /, '')}</li>)}
        </ul>
      );
    }
  }

  // KPI cards detection (very basic: looks for patterns like "Heart Rate: 72 bpm")
  const kpiRegex = /(\w+(?:\s\w+)?):\s*([\d.]+)\s*(\w+)/g;
  const matches = [...content.matchAll(kpiRegex)];
  if (matches.length >= 2) {
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', margin: '12px 0' }}>
          {matches.map((match, i) => (
            <div key={i} style={{ background: 'rgba(14,165,233,0.1)', borderRadius: '16px', padding: '12px 16px', minWidth: '120px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{match[1]}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--chat-primary)' }}>{match[2]}<span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>{match[3]}</span></div>
            </div>
          ))}
        </div>
        <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>
      </div>
    );
  }

  return <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{content}</p>;
};

export default DynamicContentRenderer;