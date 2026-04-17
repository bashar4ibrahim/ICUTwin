const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { documents, documentSigners, signatures, auditLogs, users, db } = require('../services/db');
const { requireAuth, requireManager } = require('../middleware/auth');
const { sendInvitationEmail, sendCompletionEmail } = require('../services/email');
const { embedSignaturesIntoPDF } = require('../services/pdf');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── Multer setup ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) =>
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF files allowed')),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(document_id, actor, action, meta = {}) {
  auditLogs.create({ document_id, actor_email: actor, action, metadata: JSON.stringify(meta) });
}

function toAsciiFilename(baseName = 'document') {
  const normalized = String(baseName)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]+/g, ' ')
    .replace(/[^A-Za-z0-9._ -]+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80);

  return normalized || 'document';
}

function encodeDispositionFilename(filename) {
  return encodeURIComponent(filename).replace(/['()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function setInlinePdfHeaders(res, fileLabel) {
  const safeAsciiFilename = `${toAsciiFilename(fileLabel)}.pdf`;
  const utf8Filename = `${String(fileLabel || 'document')}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${safeAsciiFilename}"; filename*=UTF-8''${encodeDispositionFilename(utf8Filename)}`
  );
}

async function finalizeDocument(doc) {
  const allSigs = signatures.findByDocument(doc.id);
  const originalPath = path.join(UPLOADS_DIR, doc.original_file_path);
  if (!fs.existsSync(originalPath)) {
    console.error('[PDF] Original file missing:', originalPath);
    return null;
  }
  const signedPath = await embedSignaturesIntoPDF(originalPath, allSigs);
  const signedFileName = path.basename(signedPath);
  const updated = documents.update(doc.id, {
    status: 'completed',
    signed_file_path: signedFileName,
    completed_at: new Date().toISOString()
  });
  log(doc.id, 'system', 'document_completed');
  return updated;
}

// ─── INVITE ROUTES (must be before /:id to avoid param collision) ─────────────

// GET /invite/:token  — get invite info, mark opened
router.get('/invite/:token', async (req, res) => {
  try {
    const signerRow = documentSigners.findByToken(req.params.token);
    if (!signerRow) return res.status(404).json({ error: 'Invalid or expired invitation' });

    if (!signerRow.invitation_opened_at) {
      documentSigners.update(signerRow.id, { invitation_opened_at: new Date().toISOString() });
      log(signerRow.document_id, signerRow.signer_email, 'invitation_opened');
    }

    const doc = documents.findById(signerRow.document_id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const uploader = users.findById(doc.uploaded_by);
    const { invitation_token, ...safeSigner } = signerRow;

    res.json({
      signer: safeSigner,
      document: {
        id: doc.id,
        title: doc.title,
        status: doc.status,
        uploader_name: uploader ? uploader.full_name : 'Manager'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /invite/:token/file — stream PDF to signer
router.get('/invite/:token/file', async (req, res) => {
  try {
    const signerRow = documentSigners.findByToken(req.params.token);
    if (!signerRow) return res.status(404).json({ error: 'Invalid invitation' });

    const doc = documents.findById(signerRow.document_id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    log(doc.id, signerRow.signer_email, 'document_viewed');

    const filePath = path.join(UPLOADS_DIR, doc.original_file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    setInlinePdfHeaders(res, doc.title || 'document');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('[SIGNFLOW] Invite preview failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /invite/:token/sign — signer submits signature
router.post('/invite/:token/sign', async (req, res) => {
  try {
    const signerRow = documentSigners.findByToken(req.params.token);
    if (!signerRow) return res.status(404).json({ error: 'Invalid invitation' });
    if (signerRow.status === 'signed') return res.status(400).json({ error: 'You have already signed this document' });

    const doc = documents.findById(signerRow.document_id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const { signature_type, signature_data, typed_name, font_style, page_number, x_position, y_position, width, height } = req.body;

    // Save signature record
    signatures.create({
      document_id: doc.id,
      signer_id: signerRow.id,
      signer_email: signerRow.signer_email,
      is_manager: false,
      signature_type,
      signature_data,
      typed_name,
      font_style,
      page_number: page_number || 1,
      x_position: x_position ?? 10,
      y_position: y_position ?? 85,
      width: width || 22,
      height: height || 8
    });

    documentSigners.update(signerRow.id, {
      status: 'signed',
      signed_at: new Date().toISOString()
    });

    log(doc.id, signerRow.signer_email, 'signer_signed', { signer_id: signerRow.id });

    // Check if ALL signers have now signed
    const allSigners = documentSigners.findByDocument(doc.id);
    const allSigned = allSigners.every(s => s.id === signerRow.id ? true : s.status === 'signed');

    if (allSigned) {
      try {
        const updated = await finalizeDocument(doc);
        if (updated) {
          // Notify owner
          const owner = users.findById(doc.uploaded_by);
          if (owner) {
            sendCompletionEmail({
              to: owner.email,
              documentTitle: doc.title,
              downloadUrl: `${process.env.APP_BASE_URL}/documents/${doc.id}`,
              managerName: owner.full_name
            }).catch(e => console.error('[EMAIL] Completion notify failed:', e.message));
          }
        }
      } catch (pdfErr) {
        console.error('[PDF] Finalization error:', pdfErr.message);
      }
    }

    res.json({ message: 'Signature submitted successfully', allSigned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DOCUMENT ROUTES ──────────────────────────────────────────────────────────

// POST /upload
router.post('/upload', requireAuth, requireManager, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });
    const doc = documents.create({
      title: req.body.title || req.file.originalname,
      original_file_path: req.file.filename,
      uploaded_by: req.user.id,
      status: 'draft'
    });
    log(doc.id, req.user.email, 'document_uploaded', { title: doc.title });
    res.status(201).json({ document: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / — list documents
router.get('/', requireAuth, (req, res) => {
  try {
    let docs;
    if (req.user.role === 'manager' || req.user.role === 'admin') {
      docs = documents.findByUploader(req.user.id);
    } else {
      const myRows = db.get('document_signers').filter({ signer_email: req.user.email }).value();
      docs = myRows.map(s => documents.findById(s.document_id)).filter(Boolean);
    }
    const enriched = docs.map(doc => ({
      ...doc,
      signers: documentSigners.findByDocument(doc.id)
    }));
    res.json({ documents: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id — single document with signers + audit
router.get('/:id', requireAuth, (req, res) => {
  try {
    const doc = documents.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const signerRows = documentSigners.findByDocument(doc.id);
    const isOwner = doc.uploaded_by === req.user.id;
    const isAssigned = signerRows.some(s => s.signer_email === req.user.email);
    if (!isOwner && !isAssigned) return res.status(403).json({ error: 'Access denied' });

    res.json({
      document: { ...doc, signers: signerRows },
      audit_logs: auditLogs.findByDocument(doc.id)
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id/file — stream PDF (requires auth)
router.get('/:id/file', requireAuth, (req, res) => {
  try {
    const doc = documents.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const signerRows = documentSigners.findByDocument(doc.id);
    const isOwner = doc.uploaded_by === req.user.id;
    const isAssigned = signerRows.some(s => s.signer_email === req.user.email);
    if (!isOwner && !isAssigned) return res.status(403).json({ error: 'Access denied' });

    const useSignedVersion = req.query.signed === 'true' && doc.signed_file_path;
    const filename = useSignedVersion ? doc.signed_file_path : doc.original_file_path;
    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    setInlinePdfHeaders(res, doc.title || 'document');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('[SIGNFLOW] Protected preview failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /:id/invite — add signers and send emails
router.post('/:id/invite', requireAuth, requireManager, async (req, res) => {
  try {
    const doc = documents.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.uploaded_by !== req.user.id) return res.status(403).json({ error: 'Not your document' });

    const { signers: signerList } = req.body;
    if (!Array.isArray(signerList) || signerList.length === 0) {
      return res.status(400).json({ error: 'signers array required' });
    }

    const results = [];
    const emailResults = [];

    for (let i = 0; i < signerList.length; i++) {
      const { email, name } = signerList[i];
      if (!email || !email.includes('@')) continue;

      let signerRow = documentSigners.findByDocumentAndEmail(doc.id, email);
      let isNew = false;

      if (!signerRow) {
        const token = crypto.randomBytes(32).toString('hex');
        signerRow = documentSigners.create({
          document_id: doc.id,
          signer_email: email,
          signer_name: name || '',
          signing_order: i + 1,
          invitation_token: token,
          invitation_sent_at: new Date().toISOString()
        });
        isNew = true;
      }

      const inviteUrl = `${process.env.APP_BASE_URL}/sign/${signerRow.invitation_token}`;

      try {
        const emailResult = await sendInvitationEmail({
          to: email,
          documentTitle: doc.title,
          signerName: name || email,
          inviteUrl,
          managerName: req.user.full_name
        });
        const delivered = emailResult.delivered !== false;
        if (delivered) {
          documentSigners.update(signerRow.id, { invitation_sent_at: new Date().toISOString() });
          if (isNew) log(doc.id, req.user.email, 'invitation_sent', { to: email });
          else log(doc.id, req.user.email, 'invitation_resent', { to: email });
        }
        emailResults.push({
          email,
          success: delivered,
          previewUrl: emailResult.previewUrl || null,
          deliveryMode: emailResult.deliveryMode || null,
          ...(delivered ? {} : { error: emailResult.reason || 'Email delivery failed' }),
        });
      } catch (emailErr) {
        console.error('[EMAIL] Failed to send to', email, ':', emailErr.message);
        emailResults.push({ email, success: false, error: emailErr.message });
      }

      results.push(signerRow);
    }

    documents.update(doc.id, { status: 'pending' });
    res.json({ signers: results, emailResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/manager-sign
router.post('/:id/manager-sign', requireAuth, requireManager, async (req, res) => {
  try {
    const doc = documents.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.uploaded_by !== req.user.id) return res.status(403).json({ error: 'Not your document' });

    const { signature_type, signature_data, typed_name, font_style, page_number, x_position, y_position, width, height } = req.body;

    const sig = signatures.create({
      document_id: doc.id,
      signer_id: req.user.id,
      signer_email: req.user.email,
      is_manager: true,
      signature_type,
      signature_data,
      typed_name,
      font_style,
      page_number: page_number || 1,
      x_position: x_position ?? 60,
      y_position: y_position ?? 85,
      width: width || 22,
      height: height || 8
    });

    documents.update(doc.id, { manager_signed: true });
    log(doc.id, req.user.email, 'manager_signed');
    res.json({ signature: sig });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/resend-invite/:signerId
router.post('/:id/resend-invite/:signerId', requireAuth, requireManager, async (req, res) => {
  try {
    const doc = documents.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.uploaded_by !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const signerRow = documentSigners.findById(req.params.signerId);
    if (!signerRow) return res.status(404).json({ error: 'Signer not found' });
    if (signerRow.document_id !== doc.id) return res.status(404).json({ error: 'Signer not found in this document' });

    const inviteUrl = `${process.env.APP_BASE_URL}/sign/${signerRow.invitation_token}`;
    
    let emailResult;
    try {
      emailResult = await sendInvitationEmail({
        to: signerRow.signer_email,
        documentTitle: doc.title,
        signerName: signerRow.signer_name || signerRow.signer_email,
        inviteUrl,
        managerName: req.user.full_name
      });
    } catch (emailErr) {
      return res.status(502).json({ error: emailErr.message || 'Email delivery failed' });
    }

    if (emailResult.delivered === false) {
      return res.status(502).json({
        error: emailResult.reason || 'Email delivery failed',
        previewUrl: emailResult.previewUrl || null,
        deliveryMode: emailResult.deliveryMode || null,
      });
    }

    documentSigners.update(signerRow.id, { invitation_sent_at: new Date().toISOString() });
    log(doc.id, req.user.email, 'invitation_resent', { to: signerRow.signer_email });

    res.json({
      success: true,
      previewUrl: emailResult.previewUrl || null,
      deliveryMode: emailResult.deliveryMode || null,
      inviteUrl,
      signer: {
        email: signerRow.signer_email,
        name: signerRow.signer_name
      }
    });
  } catch (err) {
    console.error('[RESEND] Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /:id/finalize — manually generate signed PDF
router.post('/:id/finalize', requireAuth, requireManager, async (req, res) => {
  try {
    const doc = documents.findById(req.params.id);
    if (!doc || doc.uploaded_by !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const updated = await finalizeDocument(doc);
    if (!updated) return res.status(422).json({ error: 'Original PDF file not found on disk' });

    log(doc.id, req.user.email, 'document_finalized');
    res.json({ document: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/audit
router.get('/:id/audit', requireAuth, (req, res) => {
  try {
    const doc = documents.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.uploaded_by !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    res.json({ logs: auditLogs.findByDocument(doc.id) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
