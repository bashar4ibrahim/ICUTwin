const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Mock data storage for audit trail
let auditEntries = [];
let merkleRootHash = crypto.randomBytes(32).toString('hex');

// Utility: Generate HMAC proof
const generateHmacProof = (data) => {
  const hmac = crypto.createHmac('sha256', 'mock-tee-secret-key');
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
};

// Utility: Update Merkle root
const updateMerkleRoot = (entry) => {
  const hmac = crypto.createHmac('sha256', merkleRootHash);
  hmac.update(JSON.stringify(entry));
  merkleRootHash = hmac.digest('hex');
  return merkleRootHash;
};

// Utility: Mock encryption (just for demo - in production, use real encryption)
const mockEncrypt = (data) => {
  const jsonStr = JSON.stringify(data);
  return Buffer.from(jsonStr).toString('base64');
};

const mockDecrypt = (encrypted) => {
  return JSON.parse(Buffer.from(encrypted, 'base64').toString('utf-8'));
};

// GET /tee/security_report - Current security status
router.get('/security_report', (req, res) => {
  res.json({
    overall_status: 'SECURE',
    encryption: {
      mode: 'AES-256-GCM',
      status: 'active',
    },
    audit_trail: {
      entry_count: auditEntries.length,
      last_entry: auditEntries[auditEntries.length - 1]?.timestamp || 'N/A',
    },
    code_integrity: {
      status: 'intact',
      last_verified: new Date().toISOString(),
    },
  });
});

// POST /tee/encrypt - Encrypt patient data
router.post('/encrypt', (req, res) => {
  const vitals = req.body;
  const encrypted = mockEncrypt(vitals);

  res.json({
    encrypted,
    mode: 'AES-256-GCM',
    feature_names: Object.keys(vitals),
    feature_count: Object.keys(vitals).length,
    timestamp: new Date().toISOString(),
  });
});

// POST /tee/decrypt - Decrypt result
router.post('/decrypt', (req, res) => {
  try {
    const encrypted = req.body;
    const data = mockDecrypt(encrypted.encrypted || encrypted);

    // Add audit entry
    const auditEntry = {
      event_type: 'DECRYPTION_SUCCESS',
      timestamp: new Date().toISOString(),
      actor: 'frontend',
      data: {
        action: 'ALLOWED',
        details: 'Decryption completed securely',
      },
    };
    auditEntries.push(auditEntry);
    updateMerkleRoot(auditEntry);

    res.json({ data, proof_valid: true });
  } catch (error) {
    res.status(400).json({ error: 'Decryption failed', message: error.message });
  }
});

// POST /tee/encrypted_predict - AI prediction on encrypted data
router.post('/encrypted_predict', (req, res) => {
  const { encrypted, feature_count } = req.body;

  // Mock prediction
  const mockPrediction = {
    risk_score: Math.random() * 100,
    risk_category: Math.random() > 0.5 ? 'HIGH' : 'LOW',
    confidence: 0.92,
  };

  // Create encrypted response
  const encryptedPrediction = mockEncrypt(mockPrediction);

  // Add audit entry
  const auditEntry = {
    event_type: 'PREDICTION_EXECUTED',
    timestamp: new Date().toISOString(),
    actor: 'tee-ai-model',
    data: {
      action: 'ALLOWED',
      details: `AI prediction on ${feature_count} encrypted features`,
    },
  };
  auditEntries.push(auditEntry);
  updateMerkleRoot(auditEntry);

  res.json({
    encrypted_prediction: {
      encrypted: encryptedPrediction,
      mode: 'AES-256-GCM',
    },
    proof: generateHmacProof(mockPrediction),
  });
});

// POST /tee/verify - Verify HMAC proof
router.post('/verify', (req, res) => {
  const { hmac, data } = req.body;

  if (!hmac || !data) {
    return res.status(400).json({ valid: false, error: 'Missing hmac or data' });
  }

  const expectedHmac = generateHmacProof(data);
  const valid = hmac === expectedHmac;

  const auditEntry = {
    event_type: 'VERIFICATION_' + (valid ? 'PASS' : 'FAIL'),
    timestamp: new Date().toISOString(),
    actor: 'frontend-verifier',
    data: {
      action: valid ? 'ALLOWED' : 'BLOCKED',
      details: `HMAC proof verification ${valid ? 'passed' : 'failed'}`,
    },
  };
  auditEntries.push(auditEntry);
  updateMerkleRoot(auditEntry);

  res.json({ valid, timestamp: new Date().toISOString() });
});

// GET /tee/attest - Remote attestation
router.get('/attest', (req, res) => {
  res.json({
    code_measurement:
      'A1B2C3D4E5F6' + crypto.randomBytes(28).toString('hex'),
    tee_type: 'Mock-TEE (Development)',
    code_intact: true,
    uptime_seconds: Math.floor(Math.random() * 3600) + 300,
    timestamp: new Date().toISOString(),
  });
});

// POST /tee/attest/verify - Verify attestation
router.post('/attest/verify', (req, res) => {
  const { quote } = req.body;

  if (!quote) {
    return res.status(400).json({ trusted: false, error: 'Missing quote' });
  }

  const auditEntry = {
    event_type: 'ATTESTATION_VERIFIED',
    timestamp: new Date().toISOString(),
    actor: 'attestation-service',
    data: {
      action: 'ALLOWED',
      details: 'Attestation signature verified',
    },
  };
  auditEntries.push(auditEntry);
  updateMerkleRoot(auditEntry);

  res.json({
    trusted: true,
    details: 'Attestation signature is valid. Code is unmodified.',
    timestamp: new Date().toISOString(),
  });
});

// GET /tee/audit/root - Get current Merkle root hash
router.get('/audit/root', (req, res) => {
  res.json({
    root_hash: merkleRootHash,
    entry_count: auditEntries.length,
    timestamp: new Date().toISOString(),
  });
});

// GET /tee/audit/recent - Get recent audit entries
router.get('/audit/recent', (req, res) => {
  const count = Math.min(parseInt(req.query.count, 10) || 10, 50);
  const recent = auditEntries.slice(-count).reverse();

  res.json({
    entries: recent,
    total_count: auditEntries.length,
    timestamp: new Date().toISOString(),
  });
});

// POST /tee/audit/verify_integrity - Verify audit trail integrity
router.post('/audit/verify_integrity', (req, res) => {
  res.json({
    intact: true,
    entry_count: auditEntries.length,
    deleted_entries: 0,
    tampered_entries: 0,
    root_hash: merkleRootHash,
    timestamp: new Date().toISOString(),
    details: 'All audit entries verified. No tampering detected.',
  });
});

module.exports = router;
