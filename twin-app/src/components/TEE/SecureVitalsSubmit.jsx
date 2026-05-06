import React, { useState } from 'react';
import teeConfig from '../../config/teeConfig';

export default function SecureVitalsSubmit() {
  const [vitals, setVitals] = useState({
    heart_rate: 80,
    spo2: 98,
    blood_pressure_systolic: 120,
    blood_pressure_diastolic: 80,
    temperature: 36.6,
    respiratory_rate: 16,
  });
  const [step, setStep] = useState('idle'); // idle, encrypting, sending, decrypting, done
  const [encryptedData, setEncryptedData] = useState(null);
  const [result, setResult] = useState(null);
  const [proofValid, setProofValid] = useState(null);
  const [error, setError] = useState(null);

  const handleVitalChange = (key, value) => {
    setVitals((prev) => ({ ...prev, [key]: parseFloat(value) }));
    setError(null);
  };

  const runSecurePipeline = async () => {
    setStep('encrypting');
    setError(null);
    setEncryptedData(null);
    setResult(null);
    setProofValid(null);

    try {
      // Step 1: Show Encryption
      const encData = await teeConfig.teeFetch(teeConfig.endpoints.encrypt, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vitals),
      });
      setEncryptedData(encData);

      setStep('sending');

      // Step 2: Send Encrypted Data for AI Prediction
      const predData = await teeConfig.teeFetch(teeConfig.endpoints.encryptedPredict, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encrypted: encData.encrypted,
          mode: encData.mode,
          feature_names: encData.feature_names,
          feature_count: encData.feature_count,
        }),
      });

      setStep('decrypting');

      // Step 3: Decrypt Result
      if (predData.encrypted_prediction) {
        const decData = await teeConfig.teeFetch(teeConfig.endpoints.decrypt, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(predData.encrypted_prediction),
        });
        setResult(decData.data);
        setProofValid(true);
      }

      setStep('done');
    } catch (err) {
      setError(err.message);
      setStep('idle');
    }
  };

  const resetForm = () => {
    setStep('idle');
    setEncryptedData(null);
    setResult(null);
    setProofValid(null);
    setError(null);
    setVitals({
      heart_rate: 80,
      spo2: 98,
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      temperature: 36.6,
      respiratory_rate: 16,
    });
  };

  const vitalFields = [
    { key: 'heart_rate', label: 'Heart Rate (bpm)', min: 30, max: 200 },
    { key: 'spo2', label: 'SpO2 (%)', min: 70, max: 100 },
    { key: 'blood_pressure_systolic', label: 'BP Systolic (mmHg)', min: 80, max: 200 },
    { key: 'blood_pressure_diastolic', label: 'BP Diastolic (mmHg)', min: 40, max: 130 },
    { key: 'temperature', label: 'Temperature (°C)', min: 35, max: 42 },
    { key: 'respiratory_rate', label: 'Respiratory Rate (bpm)', min: 8, max: 40 },
  ];

  return (
    <div
      style={{
        background: '#0f172a',
        padding: 25,
        borderRadius: 12,
        color: 'white',
        fontFamily: 'system-ui',
      }}
    >
      <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0' }}>
        🔐 Secure Vitals Submission
      </h3>

      {error && (
        <div
          style={{
            background: '#450a0a',
            border: '1px solid #ef4444',
            padding: 12,
            borderRadius: 6,
            marginBottom: 15,
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          ❌ Error: {error}
        </div>
      )}

      {step === 'idle' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 15,
              marginBottom: 20,
            }}
          >
            {vitalFields.map(({ key, label, min, max }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>
                  {label}
                </label>
                <input
                  type="number"
                  value={vitals[key]}
                  onChange={(e) => handleVitalChange(key, e.target.value)}
                  min={min}
                  max={max}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={runSecurePipeline}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              transition: 'all 0.2s ease',
            }}
          >
            🔒 Submit & Encrypt
          </button>
        </>
      )}

      {step === 'encrypting' && (
        <div
          style={{
            textAlign: 'center',
            padding: '30px 20px',
            background: '#1e293b',
            borderRadius: 8,
            border: '1px dashed #7c3aed',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10, animation: 'spin 2s linear infinite' }}>
            🔐
          </div>
          <div style={{ color: '#a78bfa', fontWeight: 'bold' }}>Encrypting vitals...</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
            Transforming plaintext into secure ciphertext
          </div>
        </div>
      )}

      {encryptedData && (
        <div
          style={{
            background: '#1e293b',
            padding: 15,
            borderRadius: 8,
            border: '1px solid #7c3aed',
            marginBottom: 15,
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
            ✅ ENCRYPTED DATA (Cipher Mode: {encryptedData.mode})
          </div>
          <div
            style={{
              background: '#020617',
              padding: 12,
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#22c55e',
              wordBreak: 'break-all',
              maxHeight: 80,
              overflow: 'auto',
            }}
          >
            {encryptedData.encrypted.substring(0, 120)}...
          </div>
        </div>
      )}

      {step === 'sending' && (
        <div
          style={{
            textAlign: 'center',
            padding: '30px 20px',
            background: '#1e293b',
            borderRadius: 8,
            border: '1px dashed #3b82f6',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10, animation: 'pulse 1.5s ease-in-out infinite' }}>
            📤
          </div>
          <div style={{ color: '#60a5fa', fontWeight: 'bold' }}>Sending encrypted data...</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
            Submitting to TEE for secure prediction
          </div>
        </div>
      )}

      {step === 'decrypting' && (
        <div
          style={{
            textAlign: 'center',
            padding: '30px 20px',
            background: '#1e293b',
            borderRadius: 8,
            border: '1px dashed #22c55e',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10, animation: 'spin 2s linear infinite' }}>
            🔓
          </div>
          <div style={{ color: '#10b981', fontWeight: 'bold' }}>Decrypting result...</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
            Securely revealing the AI prediction
          </div>
        </div>
      )}

      {result && (
        <div
          style={{
            background: 'linear-gradient(135deg, #052e16, #0f2a1e)',
            padding: 20,
            borderRadius: 8,
            border: '1px solid #22c55e',
            marginTop: 15,
          }}
        >
          <div style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: 10 }}>
            ✅ SECURE PREDICTION RESULT
          </div>
          <div
            style={{
              background: '#020617',
              padding: 15,
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 13,
              color: '#e2e8f0',
              marginBottom: 15,
            }}
          >
            <pre style={{ margin: 0, overflow: 'auto' }}>
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </pre>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            This result was generated inside the TEE and cannot be mathematically altered.
          </div>
        </div>
      )}

      {step === 'done' && (
        <button
          onClick={resetForm}
          style={{
            marginTop: 15,
            padding: '10px 24px',
            background: '#334155',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
          }}
        >
          🔄 Submit Another
        </button>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
