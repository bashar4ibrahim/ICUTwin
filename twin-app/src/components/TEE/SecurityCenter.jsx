import React, { useState } from 'react';
import TEEShield from './TEEShield';
import SecureVitalsSubmit from './SecureVitalsSubmit';
import MerkleAuditExplorer from './MerkleAuditExplorer';
import AttestationCertificate from './AttestationCertificate';

export default function SecurityCenter() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    border: 'none',
    background: isActive ? '#7c3aed' : '#334155',
    color: 'white',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    fontSize: 14,
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ padding: '20px', color: 'white', fontFamily: 'system-ui' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, color: '#e2e8f0' }}>
          🔐 Zero-Trust Security Center
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
          Cryptographic proof of integrity, attestation, and audit trail verification
        </p>
      </div>

      {/* TEE Shield Global Status */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' }}>
          Global TEE Status
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <TEEShield />
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 25, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={tabStyle(activeTab === 'overview')}
        >
          📋 Overview
        </button>
        <button
          onClick={() => setActiveTab('attestation')}
          style={tabStyle(activeTab === 'attestation')}
        >
          📜 Attestation
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={tabStyle(activeTab === 'audit')}
        >
          🌲 Audit Trail
        </button>
        <button
          onClick={() => setActiveTab('vitals')}
          style={tabStyle(activeTab === 'vitals')}
        >
          💊 Secure Vitals
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 25 }}>
            <div
              style={{
                background: '#0f1729',
                padding: 25,
                borderRadius: 12,
                border: '1px solid #334155',
              }}
            >
              <h3 style={{ margin: '0 0 15px 0', color: '#e2e8f0' }}>
                What is Zero-Trust Security?
              </h3>
              <p style={{ margin: '0 0 10px 0', color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>
                Traditional security relies on "trust me" claims. This platform shifts to{' '}
                <strong style={{ color: '#e2e8f0' }}>mathematical proof</strong>. Every action,
                every state change, every piece of data is verifiable through:
              </p>
              <ul
                style={{
                  margin: '10px 0 0 20px',
                  color: '#cbd5e1',
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                <li>
                  <strong>🛡️ Attestation:</strong> Cryptographic proof that the server code is
                  unmodified and running in a Trusted Execution Environment
                </li>
                <li>
                  <strong>🌲 Merkle Audit Trail:</strong> Immutable log of all actions. Any deletion
                  or tampering is immediately detected
                </li>
                <li>
                  <strong>🔐 HMAC Proofs:</strong> Mathematical signatures prove data integrity.
                  Click "Verify" to cryptographically confirm any result
                </li>
                <li>
                  <strong>🔓 Encrypted Workflows:</strong> See patient data transform into
                  ciphertext before your eyes, then securely processed
                </li>
              </ul>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div
                style={{
                  background: '#0f2a1e',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid #22c55e33',
                  color: '#10b981',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#6ee7b7' }}>Remote Attestation</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#a7f3d0' }}>
                  Digital passport proving your server code is unmodified
                </p>
              </div>

              <div
                style={{
                  background: '#0f172a',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid #3b82f633',
                  color: '#60a5fa',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔐</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#93c5fd' }}>Data Encryption</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#bfdbfe' }}>
                  Patient vitals encrypted before leaving the client
                </p>
              </div>

              <div
                style={{
                  background: '#1e1b4b',
                  padding: 20,
                  borderRadius: 12,
                  border: '1px solid #7c3aed33',
                  color: '#a78bfa',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                <h4 style={{ margin: '0 0 8px 0', color: '#c4b5fd' }}>Merkle Proofs</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#ddd6fe' }}>
                  Click "Verify" on any data to prove its integrity cryptographically
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Attestation Tab */}
        {activeTab === 'attestation' && (
          <div>
            <div style={{ marginBottom: 15 }}>
              <p style={{ color: '#cbd5e1', fontSize: 14 }}>
                The Attestation Certificate is your cryptographic proof that the server code running
                on the backend has not been modified. It acts as a digital passport for the entire system.
              </p>
            </div>
            <AttestationCertificate />
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div>
            <div style={{ marginBottom: 15 }}>
              <p style={{ color: '#cbd5e1', fontSize: 14 }}>
                Every action on this system is recorded in an immutable Merkle tree. The root hash
                changes with each entry. You can verify any point in history hasn't been tampered with.
              </p>
            </div>
            <MerkleAuditExplorer />
          </div>
        )}

        {/* Vitals Tab */}
        {activeTab === 'vitals' && (
          <div>
            <div style={{ marginBottom: 15 }}>
              <p style={{ color: '#cbd5e1', fontSize: 14 }}>
                Submit patient vitals and watch them transform into encrypted ciphertext before being
                securely processed by the TEE. Results are then decrypted locally.
              </p>
            </div>
            <SecureVitalsSubmit />
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 40,
          paddingTop: 20,
          borderTop: '1px solid #334155',
          color: '#64748b',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0 }}>
          🔓 <strong>Verify Everything.</strong> Don't just trust—mathematically prove security.
        </p>
      </div>
    </div>
  );
}
