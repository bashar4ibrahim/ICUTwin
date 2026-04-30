import React, { useState, useEffect, useRef } from 'react';
import teeConfig from '../../config/teeConfig';

export default function TEEShield() {
  const [status, setStatus] = useState('LOADING');
  const [report, setReport] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const errCountRef = useRef(0);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const checkStatus = async () => {
      try {
        const data = await teeConfig.teeFetch(teeConfig.endpoints.securityReport);
        if (!mountedRef.current) return;
        setReport(data);
        setStatus(data.overall_status || 'SECURE');
        setLastChecked(new Date());
        errCountRef.current = 0;
      } catch {
        if (!mountedRef.current) return;
        errCountRef.current += 1;
        setStatus(errCountRef.current <= 1 ? 'LOADING' : 'OFFLINE');
      }
      scheduleNext();
    };

    const scheduleNext = () => {
      if (!mountedRef.current) return;
      const delay = teeConfig.getBackoffInterval(errCountRef.current);
      timerRef.current = setTimeout(checkStatus, delay);
    };

    checkStatus();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const colors = {
    SECURE: { bg: '#0f2a1e', border: '#22c55e', text: '#4ade80', icon: '🛡️' },
    COMPROMISED: { bg: '#2a0f0f', border: '#ef4444', text: '#f87171', icon: '🚨' },
    LOADING: { bg: '#1a1a2e', border: '#60a5fa', text: '#93c5fd', icon: '⏳' },
    OFFLINE: { bg: '#1a1a2e', border: '#64748b', text: '#94a3b8', icon: '📡' },
    ERROR: { bg: '#1a1a2e', border: '#fbbf24', text: '#fcd34d', icon: '⚠️' },
  };

  const style = colors[status] || colors.ERROR;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 20,
        background: style.bg,
        border: `1px solid ${style.border}`,
        fontFamily: 'monospace',
        fontSize: 12,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow:
          status === 'COMPROMISED'
            ? `0 0 15px ${style.border}`
            : status === 'SECURE'
              ? `0 0 8px ${style.border}33`
              : 'none',
        userSelect: 'none',
      }}
      title={
        status === 'OFFLINE'
          ? 'Backend unreachable — retrying with backoff'
          : lastChecked
            ? `Last checked: ${lastChecked.toLocaleTimeString()}`
            : 'Checking security status'
      }
    >
      <span style={{ fontSize: 16 }}>{style.icon}</span>
      <span style={{ color: style.text, fontWeight: 'bold' }}>
        TEE: {status}
      </span>
      {status === 'OFFLINE' && (
        <span style={{ color: '#64748b', fontSize: 10 }}>
          (retrying...)
        </span>
      )}
      {report && (
        <span style={{ color: '#9ca3af', fontSize: 10 }}>
          (Enc: {report.encryption?.mode || 'N/A'} | Audit: {report.audit_trail?.entry_count || 0} logs)
        </span>
      )}
    </div>
  );
}
