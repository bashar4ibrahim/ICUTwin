import React, { useState, useEffect, useRef } from 'react';
import teeConfig from '../../config/teeConfig';

export default function MerkleAuditExplorer() {
  const [rootHash, setRootHash] = useState('...');
  const [entries, setEntries] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const errCountRef = useRef(0);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const refreshAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rootData, entriesData] = await Promise.all([
        teeConfig.teeFetch(teeConfig.endpoints.auditRoot),
        teeConfig.teeFetch(`${teeConfig.endpoints.auditRecent}?count=8`),
      ]);

      if (!mountedRef.current) return;
      setRootHash(rootData.root_hash || '...');
      setEntries(Array.isArray(entriesData.entries) ? entriesData.entries : []);
      errCountRef.current = 0;
    } catch (err) {
      if (!mountedRef.current) return;
      errCountRef.current += 1;
      setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
      scheduleNext();
    }
  };

  const scheduleNext = () => {
    if (!mountedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = teeConfig.getBackoffInterval(errCountRef.current);
    timerRef.current = setTimeout(refreshAudit, delay);
  };

  useEffect(() => {
    mountedRef.current = true;
    refreshAudit();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const verifyIntegrity = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teeConfig.teeFetch(teeConfig.endpoints.auditVerifyIntegrity, {
        method: 'POST',
      });
      setVerificationResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      style={{
        background: '#0f172a',
        padding: 20,
        borderRadius: 12,
        color: 'white',
        fontFamily: 'monospace',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>🌲 Merkle Audit Trail</h3>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>CURRENT ROOT HASH</div>
          <div
            style={{
              fontSize: 11,
              color: '#fbbf24',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'color 0.2s',
              wordBreak: 'break-all',
            }}
            onClick={() => copyToClipboard(rootHash)}
            title="Click to copy"
          >
            {rootHash.substring(0, 24)}...
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#450a0a',
            border: '1px solid #ef4444',
            padding: 12,
            borderRadius: 6,
            marginBottom: 15,
            color: '#fca5a5',
            fontSize: 12,
          }}
        >
          ⚠️ Error: {error}
        </div>
      )}

      {verificationResult && (
        <div
          style={{
            background: verificationResult.intact ? '#052e16' : '#450a0a',
            border: `1px solid ${verificationResult.intact ? '#22c55e' : '#ef4444'}`,
            padding: 12,
            borderRadius: 6,
            marginBottom: 15,
            fontSize: 12,
            fontWeight: 'bold',
          }}
        >
          <span style={{ color: verificationResult.intact ? '#22c55e' : '#ef4444' }}>
            {verificationResult.intact
              ? '✅ TRAIL INTACT'
              : '🚨 TAMPERING DETECTED'}
          </span>
          {verificationResult.entry_count && (
            <span style={{ color: '#94a3b8', marginLeft: 12, fontWeight: 'normal' }}>
              {verificationResult.entry_count} entries verified
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 15, flexWrap: 'wrap' }}>
        <button
          onClick={refreshAudit}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#334155',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 'bold',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          🔄 Refresh
        </button>
        <button
          onClick={verifyIntegrity}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 'bold',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          🛡️ Verify Integrity
        </button>
      </div>

      {/* Audit Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px 20px',
              color: '#64748b',
              fontSize: 13,
            }}
          >
            {loading ? 'Loading audit entries...' : error ? 'Backend unreachable — click Refresh to retry' : 'No audit entries found'}
          </div>
        ) : (
          entries.map((entry, i) => (
            <div
              key={i}
              style={{
                background: '#1e293b',
                padding: 12,
                borderRadius: 6,
                borderLeft: `3px solid ${
                  entry.event_type?.includes('BLOCK') || entry.data?.action === 'BLOCKED'
                    ? '#ef4444'
                    : entry.event_type?.includes('SUCCESS') || entry.data?.action === 'ALLOWED'
                      ? '#22c55e'
                      : '#3b82f6'
                }`,
                fontSize: 11,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
                  {entry.event_type || 'UNKNOWN'}
                </span>
                <span style={{ color: '#64748b', fontSize: 10 }}>
                  {entry.timestamp
                    ? new Date(entry.timestamp).toLocaleTimeString()
                    : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Actor: {entry.actor || 'system'}</span>
                <span
                  style={{
                    color:
                      entry.data?.action === 'BLOCKED'
                        ? '#ef4444'
                        : entry.data?.action === 'ALLOWED'
                          ? '#22c55e'
                          : '#94a3b8',
                    fontWeight: 'bold',
                  }}
                >
                  {entry.data?.action || 'N/A'}
                </span>
              </div>
              {entry.data?.details && (
                <div style={{ color: '#64748b', marginTop: 6, fontSize: 10 }}>
                  {entry.data.details}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 15,
          borderTop: '1px solid #334155',
          display: 'flex',
          gap: 15,
          flexWrap: 'wrap',
          fontSize: 10,
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#22c55e', borderRadius: 2 }} />
          Allowed
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 2 }} />
          Blocked
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: '#3b82f6', borderRadius: 2 }} />
          Other
        </div>
      </div>
    </div>
  );
}
