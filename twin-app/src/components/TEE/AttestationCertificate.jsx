import React, { useState, useEffect, useRef } from 'react';
import teeConfig from '../../config/teeConfig';

export default function AttestationCertificate() {
  const [quote, setQuote] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAttestation = async () => {
      try {
        const data = await teeConfig.teeFetch(teeConfig.endpoints.attest);
        if (!mountedRef.current) return;
        setQuote(data);
        setLoading(false);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err.message);
        setLoading(false);
      }
    };
    fetchAttestation();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const retryFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teeConfig.teeFetch(teeConfig.endpoints.attest);
      setQuote(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAttestation = async () => {
    if (!quote) return;
    setVerifying(true);
    setError(null);
    try {
      const data = await teeConfig.teeFetch(teeConfig.endpoints.attestVerify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote }),
      });
      setVerification(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          padding: 25,
          borderRadius: 12,
          color: 'white',
          fontFamily: 'monospace',
          border: '1px solid #4c1d95',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 12, animation: 'spin 2s linear infinite' }}>
          📜
        </div>
        <div style={{ color: '#a78bfa' }}>Loading Attestation...</div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!quote) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          padding: 25,
          borderRadius: 12,
          color: 'white',
          fontFamily: 'monospace',
          border: '1px solid #4c1d95',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 12 }}>📡</div>
        <div style={{ color: '#f87171', marginBottom: 8 }}>Failed to load attestation certificate</div>
        {error && <div style={{ fontSize: 12, marginTop: 4, color: '#fca5a5', marginBottom: 12 }}>{error}</div>}
        <button
          onClick={retryFetch}
          style={{
            padding: '8px 20px',
            background: '#4c1d95',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 13,
            transition: 'all 0.2s',
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        padding: 25,
        borderRadius: 12,
        color: 'white',
        fontFamily: 'monospace',
        border: '1px solid #4c1d95',
        textAlign: 'center',
      }}
    >
      <h2 style={{ margin: '0 0 8px 0', fontSize: 24 }}>📜 Attestation Certificate</h2>
      <p style={{ fontSize: 11, color: '#a78bfa', margin: '0 0 20px 0' }}>
        Simulated Remote Attestation (TEE Identity)
      </p>

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

      {/* Code Measurement Hash */}
      <div
        style={{
          background: '#020617',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #334155',
        }}
      >
        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 10 }}>
          CODE MEASUREMENT HASH (SHA-256)
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#e2e8f0',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            cursor: 'pointer',
            padding: 8,
            background: '#1e293b',
            borderRadius: 4,
            transition: 'background 0.2s',
          }}
          onClick={() => copyToClipboard(quote.code_measurement)}
          title="Click to copy"
        >
          {quote.code_measurement}
        </div>
      </div>

      {/* Status Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 15,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: '#1e293b',
            padding: 15,
            borderRadius: 8,
            border: '1px solid #334155',
          }}
        >
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>TEE Type</div>
          <div
            style={{
              color: '#fbbf24',
              fontWeight: 'bold',
              fontSize: 13,
            }}
          >
            {quote.tee_type || 'UNKNOWN'}
          </div>
        </div>

        <div
          style={{
            padding: 15,
            borderRadius: 8,
            border: `1px solid ${quote.code_intact ? '#22c55e' : '#ef4444'}`,
            background: quote.code_intact ? '#0f2a1e' : '#2a0f0f',
          }}
        >
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>Code Integrity</div>
          <div
            style={{
              color: quote.code_intact ? '#22c55e' : '#ef4444',
              fontWeight: 'bold',
              fontSize: 13,
            }}
          >
            {quote.code_intact ? 'YES ✅' : 'NO ❌'}
          </div>
        </div>

        <div
          style={{
            background: '#1e293b',
            padding: 15,
            borderRadius: 8,
            border: '1px solid #334155',
          }}
        >
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>Uptime</div>
          <div
            style={{
              color: '#60a5fa',
              fontWeight: 'bold',
              fontSize: 13,
            }}
          >
            {quote.uptime_seconds
              ? `${Math.floor(quote.uptime_seconds / 60)}m`
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Verify Button */}
      <button
        onClick={verifyAttestation}
        disabled={verifying}
        style={{
          padding: '12px 28px',
          background: '#4c1d95',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: verifying ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: 14,
          transition: 'all 0.2s',
          opacity: verifying ? 0.6 : 1,
        }}
      >
        {verifying ? '🔄 Verifying...' : '🔐 Verify Attestation Signature'}
      </button>

      {/* Verification Result */}
      {verification && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            background: verification.trusted ? '#052e16' : '#450a0a',
            borderRadius: 8,
            border: `1px solid ${verification.trusted ? '#22c55e' : '#ef4444'}`,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 'bold',
              color: verification.trusted ? '#22c55e' : '#ef4444',
              marginBottom: 8,
            }}
          >
            {verification.trusted
              ? '✅ ATTESTATION VERIFIED'
              : '🚨 ATTESTATION FAILED'}
          </div>
          <div
            style={{
              fontSize: 12,
              color: verification.trusted ? '#c6f6d5' : '#fca5a5',
            }}
          >
            {verification.trusted
              ? 'Code is unmodified and running in a secure TEE.'
              : 'Code has been modified or attestation cannot be verified.'}
          </div>
          {verification.details && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: verification.trusted ? '#1e3a1f' : '#3a1e1e',
                borderRadius: 4,
                fontSize: 11,
                color: verification.trusted ? '#86efac' : '#fca5a5',
              }}
            >
              {verification.details}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
