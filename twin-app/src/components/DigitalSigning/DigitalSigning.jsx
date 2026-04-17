// DigitalSigning.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiLogOut,
  FiMail,
  FiPenTool,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import SignaturePadLite from './SignaturePadLite';
import {
  SIGNFLOW_API_BASE,
  buildProtectedDocumentUrl,
  buildUploadedAssetUrl,
  clearSignflowSession,
  getSignflowToken,
  getStoredSignflowUser,
  persistSignflowSession,
  signflowLogin,
  signflowMe,
  signflowRegister,
  signflowRequest,
} from './signflowApi';
import {
  formatSignflowDate,
  formatSignflowDateTime,
  getSignedCount,
  getSignflowInitials,
  SIGNFLOW_ACTION_LABELS,
} from './signflowMeta';
import './DigitalSigning.css';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  hover: { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', transition: { duration: 0.2 } },
};

const listItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05 } }),
};

const DEFAULT_SIGNERS = [{ email: '', name: '' }];

function StatusBadge({ status }) {
  const label = status ? `${status}`.replace(/_/g, ' ') : 'unknown';
  return <span className={`signing-status signing-status--${status || 'draft'}`}>{label}</span>;
}

function StatCard({ label, value, tone = 'default' }) {
  return (
    <motion.div
      className={`card signing-stat-card signing-stat-card--${tone}`}
      variants={cardVariants}
      whileHover="hover"
    >
      <span className="signing-stat-card__label">{label}</span>
      <strong className="signing-stat-card__value">{value}</strong>
    </motion.div>
  );
}

function EmptyState({ icon, title, copy, action }) {
  return (
    <motion.div className="card signing-empty" variants={cardVariants}>
      <div className="signing-empty__icon">{icon}</div>
      <h3>{title}</h3>
      <p>{copy}</p>
      {action}
    </motion.div>
  );
}

export default function DigitalSigning() {
  const appBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fileInputRef = useRef(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(getSignflowToken()));
  const [signflowUser, setSignflowUser] = useState(() => getStoredSignflowUser());
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'manager',
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailTab, setDetailTab] = useState('overview');

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [draggingFile, setDraggingFile] = useState(false);

  const [inviteRows, setInviteRows] = useState(DEFAULT_SIGNERS);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [resending, setResending] = useState({});
  const [finalizeBusy, setFinalizeBusy] = useState(false);

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureBusy, setSignatureBusy] = useState(false);
  const [signatureSuccess, setSignatureSuccess] = useState('');
  const [signaturePosition, setSignaturePosition] = useState({ page: 1, x: 65, y: 85 });

  const isManager = signflowUser?.role === 'manager' || signflowUser?.role === 'admin';
  const visibleDocuments =
    statusFilter === 'all' ? documents : documents.filter((document) => document.status === statusFilter);
  const stats = {
    total: documents.length,
    pending: documents.filter((document) => document.status === 'pending').length,
    completed: documents.filter((document) => document.status === 'completed').length,
    draft: documents.filter((document) => document.status === 'draft').length,
  };

  const syncSignflowSession = async () => {
    if (!getSignflowToken()) {
      setSessionLoading(false);
      return;
    }

    try {
      const payload = await signflowMe();
      persistSignflowSession(getSignflowToken(), payload.user);
      setSignflowUser(payload.user);
    } catch (error) {
      clearSignflowSession();
      setSignflowUser(null);
      setAuthError(error.message);
    } finally {
      setSessionLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!signflowUser) return;
    setDocumentsLoading(true);
    setDocumentsError('');
    try {
      const payload = await signflowRequest('/documents');
      setDocuments(payload.documents || []);
    } catch (error) {
      setDocumentsError(error.message);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const openDocument = async (documentId, nextTab = 'overview') => {
    setActiveView('detail');
    setSelectedDocumentId(documentId);
    setDetailTab(nextTab);
    setDetailLoading(true);
    setDetailError('');
    setInviteResult(null);
    setSignatureSuccess('');

    try {
      const payload = await signflowRequest(`/documents/${documentId}`);
      setSelectedDocument(payload.document || null);
      setAuditLogs(payload.audit_logs || []);
      setInviteRows(DEFAULT_SIGNERS);
    } catch (error) {
      setSelectedDocument(null);
      setAuditLogs([]);
      setDetailError(error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshCurrentDocument = async () => {
    await loadDocuments();
    if (selectedDocumentId) {
      await openDocument(selectedDocumentId, detailTab);
    }
  };

  useEffect(() => {
    syncSignflowSession();
  }, []);

  useEffect(() => {
    if (signflowUser) {
      loadDocuments();
    }
  }, [signflowUser]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');

    try {
      const payload =
        authMode === 'login'
          ? await signflowLogin(authForm.email, authForm.password)
          : await signflowRegister(authForm);

      persistSignflowSession(payload.token, payload.user);
      setSignflowUser(payload.user);
      setActiveView('dashboard');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    clearSignflowSession();
    setSignflowUser(null);
    setDocuments([]);
    setSelectedDocument(null);
    setSelectedDocumentId(null);
    setAuthForm((current) => ({ ...current, password: '' }));
    setActiveView('dashboard');
  };

  const attachUploadFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted for signing workflows.');
      return;
    }

    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.pdf$/i, ''));
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploadBusy(true);
    setUploadError('');

    try {
      const form = new FormData();
      form.append('pdf', uploadFile);
      form.append('title', uploadTitle || uploadFile.name);
      const payload = await signflowRequest('/documents/upload', { method: 'POST', body: form });
      setUploadFile(null);
      setUploadTitle('');
      await loadDocuments();
      await openDocument(payload.document.id);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploadBusy(false);
    }
  };

  const handleInvite = async () => {
    const validSigners = inviteRows.filter((entry) => entry.email.trim());
    if (!selectedDocumentId || !validSigners.length) return;

    setInviteBusy(true);
    setDetailError('');
    setSignatureSuccess('');
    try {
      const payload = await signflowRequest(`/documents/${selectedDocumentId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ signers: validSigners }),
      });

      const emailResults = payload?.emailResults || [];
      const failedDeliveries = emailResults.filter((result) => !result.success);

      setInviteResult({ ...payload, emailResults });
      await refreshCurrentDocument();

      if (failedDeliveries.length > 0) {
        const failureText = failedDeliveries
          .map((result) => `${result.email}: ${result.error || 'Email delivery failed'}`)
          .join(' | ');
        setDetailError(`Some invitations were created but not delivered: ${failureText}`);
      } else {
        setSignatureSuccess(`Invitations sent to ${emailResults.length || validSigners.length} signer(s).`);
      }
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setInviteBusy(false);
    }
  };

  const handleManagerSignature = async (signature) => {
    if (!selectedDocumentId) return;
    setSignatureBusy(true);
    try {
      await signflowRequest(`/documents/${selectedDocumentId}/manager-sign`, {
        method: 'POST',
        body: JSON.stringify({
          signature_type: signature.type,
          signature_data: signature.data,
          typed_name: signature.typed_name,
          font_style: signature.font_style,
          page_number: signaturePosition.page,
          x_position: signaturePosition.x,
          y_position: signaturePosition.y,
          width: 22,
          height: 8,
        }),
      });
      setShowSignatureModal(false);
      setSignatureSuccess('Manager signature recorded successfully.');
      await refreshCurrentDocument();
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setSignatureBusy(false);
    }
  };

  const handleResend = async (signerId) => {
    if (!selectedDocumentId) return;
    setResending((current) => ({ ...current, [signerId]: true }));
    setSignatureSuccess('');
    try {
      const payload = await signflowRequest(`/documents/${selectedDocumentId}/resend-invite/${signerId}`, {
        method: 'POST',
      });

      if (!payload.success) {
        throw new Error(payload.error || 'Failed to resend invite');
      }

      if (payload.previewUrl) {
        window.open(payload.previewUrl, '_blank', 'noopener,noreferrer');
      }

      await refreshCurrentDocument();
      setDetailError('');
      setSignatureSuccess(`Invitation resent to ${payload?.signer?.email || 'the signer'}.`);
    } catch (error) {
      setDetailError(`Failed to resend invitation: ${error.message}`);
    } finally {
      setResending((current) => ({ ...current, [signerId]: false }));
    }
  };

  const handleFinalize = async () => {
    if (!selectedDocumentId) return;
    setFinalizeBusy(true);
    try {
      await signflowRequest(`/documents/${selectedDocumentId}/finalize`, { method: 'POST' });
      await refreshCurrentDocument();
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setFinalizeBusy(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="loading-spinner">
        <span className="spinner" />
        <span>Restoring the signing workspace...</span>
      </div>
    );
  }

  if (!signflowUser) {
    return (
      <motion.div className="signing-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <section className="signing-header">
          <div>
            <div className="card-title">Integrated SignFlow</div>
            <h1>Digital signing inside the ICU system</h1>
            <p>
              This workspace now runs inside your main application shell. Users keep the same ICU
              navigation while SignFlow handles document upload, invitations, and final signed PDFs.
            </p>
          </div>
          <div className="signing-status-rail">
            <div className="signing-chip"><FiShield /> Shared frontend shell</div>
            <div className="signing-chip signing-chip--subtle"><FiMail /> Backend: {SIGNFLOW_API_BASE}</div>
          </div>
        </section>

        <div className="signing-auth-layout">
          <motion.section className="card signing-auth-copy" variants={cardVariants}>
            <h2>Unified but still secure</h2>
            <p>
              SignFlow remains its own signing service, but users no longer have to leave this
              product to manage approvals. Invitation links should point back to <strong>{appBaseUrl}/sign/...</strong>.
            </p>
            <div className="signing-check-list">
              {['One navbar, one visual language, one frontend runtime.', 'Separate signing credentials stay isolated from ICU auth.', 'Manager actions, signer tracking, and audit trail stay intact.'].map((text, i) => (
                <motion.div key={i} custom={i} variants={listItemVariants} initial="initial" animate="animate">
                  <FiCheckCircle /> {text}
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section className="card signing-auth-panel" variants={cardVariants}>
            <div className="signing-auth-toggle">
              <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Sign in</button>
              <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Create account</button>
            </div>

            {authError && <div className="signing-alert signing-alert--error"><FiAlertCircle /> {authError}</div>}

            <form className="signing-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <>
                  <label className="form-label">Full name</label>
                  <input className="input-field" value={authForm.full_name} onChange={(event) => setAuthForm({ ...authForm, full_name: event.target.value })} placeholder="Dr. Ahmad Khalil" />
                  <label className="form-label">Role</label>
                  <select className="input-field" value={authForm.role} onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })}>
                    <option value="manager">Manager</option>
                    <option value="signer">Signer</option>
                  </select>
                </>
              )}
              <label className="form-label">Email</label>
              <input className="input-field" type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="board.member@hospital.com" />
              <label className="form-label">Password</label>
              <input className="input-field" type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Enter your secure password" />
              <motion.button className="btn btn-primary btn-lg signing-submit" type="submit" disabled={authBusy} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {authBusy ? <span className="spinner" /> : authMode === 'login' ? <FiShield /> : <FiUser />}
                {authMode === 'login' ? 'Open signing workspace' : 'Create signing profile'}
              </motion.button>
            </form>
          </motion.section>
        </div>
      </motion.div>
    );
  }

  const documentSigners = selectedDocument?.signers || [];
  const signedCount = getSignedCount(documentSigners);
  const allSigned = documentSigners.length > 0 && signedCount === documentSigners.length;
  const isOwner = selectedDocument?.uploaded_by === signflowUser?.id;

  return (
    <motion.div className="signing-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <section className="signing-header">
        <div>
          <div className="card-title">Digital Signing Workspace</div>
          <h1>{isManager ? 'Document control and signature flow' : 'Your active signing tasks'}</h1>
          <p>
            SignFlow is now presented as a native ICU workspace. Upload PDFs, monitor signer progress,
            resend invitations, and review the audit trail from the same system shell.
          </p>
        </div>
        <motion.div className="card signing-identity-card" variants={cardVariants} whileHover={{ y: -2 }}>
          <div className="signing-identity-card__avatar">{getSignflowInitials(signflowUser.full_name || signflowUser.email)}</div>
          <div className="signing-identity-card__body">
            <strong>{signflowUser.full_name || signflowUser.email}</strong>
            <span>{signflowUser.role}</span>
          </div>
          <motion.button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <FiLogOut /> Disconnect
          </motion.button>
        </motion.div>
      </section>

      <div className="signing-workspace">
        <aside className="card signing-sidebar">
          {[
            { view: 'dashboard', icon: FiShield, label: 'Overview' },
            { view: 'documents', icon: FiFileText, label: 'Documents' },
            ...(isManager ? [{ view: 'upload', icon: FiUploadCloud, label: 'Upload' }] : []),
          ].map(({ view, icon: Icon, label }) => (
            <motion.button
              key={view}
              type="button"
              className={`signing-nav ${activeView === view ? 'active' : ''}`}
              onClick={() => setActiveView(view)}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Icon /> {label}
            </motion.button>
          ))}
          <div className="signing-sidebar__note">Integrated runtime active. Invitation links are generated back to <strong>{appBaseUrl}</strong> automatically.</div>
        </aside>

        <section className="signing-content">
          <AnimatePresence mode="wait">
            {documentsError && (
              <motion.div className="signing-alert signing-alert--error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FiAlertCircle /> {documentsError}
              </motion.div>
            )}
            {detailError && activeView === 'detail' && (
              <motion.div className="signing-alert signing-alert--error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FiAlertCircle /> {detailError}
              </motion.div>
            )}
            {signatureSuccess && activeView === 'detail' && (
              <motion.div className="signing-alert signing-alert--success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FiCheckCircle /> {signatureSuccess}
              </motion.div>
            )}
          </AnimatePresence>

          {activeView === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="signing-stats-grid">
                <StatCard label="Total documents" value={stats.total} />
                <StatCard label="Awaiting signatures" value={stats.pending} tone="warning" />
                <StatCard label="Completed" value={stats.completed} tone="success" />
                <StatCard label="Drafts" value={stats.draft} tone="muted" />
              </div>
              {documentsLoading ? (
                <div className="loading-spinner"><span className="spinner" /><span>Loading SignFlow data...</span></div>
              ) : visibleDocuments.length === 0 ? (
                <EmptyState
                  icon={<FiFileText />}
                  title="No signing activity yet"
                  copy={isManager ? 'Upload a PDF to start your first integrated signing workflow.' : 'Documents assigned to you will appear here once invitations are sent.'}
                  action={isManager ? <motion.button type="button" className="btn btn-primary" onClick={() => setActiveView('upload')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><FiUploadCloud /> Upload document</motion.button> : null}
                />
              ) : (
                <motion.div className="card signing-table-card" variants={cardVariants}>
                  <div className="signing-table-head">
                    <h3>Recent signing workflows</h3>
                    <motion.button type="button" className="btn btn-secondary btn-sm" onClick={loadDocuments} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <FiRefreshCw /> Refresh
                    </motion.button>
                  </div>
                  <table>
                    <thead><tr><th>Document</th><th>Status</th><th>Signers</th><th>Created</th><th>Action</th></tr></thead>
                    <tbody>
                      {documents.slice(0, 6).map((document) => (
                        <motion.tr key={document.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                          <td><strong>{document.title}</strong></td>
                          <td><StatusBadge status={document.status} /></td>
                          <td>{getSignedCount(document.signers || [])}/{(document.signers || []).length}</td>
                          <td>{formatSignflowDate(document.created_at)}</td>
                          <td><motion.button type="button" className="btn btn-ghost btn-sm" onClick={() => openDocument(document.id)} whileHover={{ scale: 1.05 }}><FiEye /> Open</motion.button></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeView === 'documents' && (
            <motion.div key="documents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="card signing-table-card">
                <div className="signing-table-head">
                  <div><h3>Document center</h3><p>Review workflow status, preview PDFs, and move into detailed signer management.</p></div>
                  <motion.button type="button" className="btn btn-secondary btn-sm" onClick={loadDocuments} whileHover={{ scale: 1.05 }}><FiRefreshCw /> Refresh</motion.button>
                </div>
                <div className="signing-filter-row">
                  {['all', 'draft', 'pending', 'completed'].map((filter) => (
                    <button key={filter} type="button" className={`signing-filter ${statusFilter === filter ? 'active' : ''}`} onClick={() => setStatusFilter(filter)}>{filter}</button>
                  ))}
                </div>
                {documentsLoading ? <div className="loading-spinner"><span className="spinner" /><span>Loading documents...</span></div> : visibleDocuments.length === 0 ? <EmptyState icon={<FiClock />} title="No matching documents" copy="Try another status filter or create a new signing request." /> : (
                  <table><thead><tr><th>Document</th><th>Status</th><th>Progress</th><th>Created</th><th>Actions</th></tr></thead>
                    <tbody>{visibleDocuments.map((document) => (
                      <tr key={document.id}>
                        <td><strong>{document.title}</strong></td>
                        <td><StatusBadge status={document.status} /></td>
                        <td>{getSignedCount(document.signers || [])}/{(document.signers || []).length} signed</td>
                        <td>{formatSignflowDate(document.created_at)}</td>
                        <td>
                          <div className="signing-table-actions">
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => openDocument(document.id)}><FiEye /> View</button>
                            {document.status === 'completed' && document.signed_file_path && <a className="btn btn-secondary btn-sm" href={buildUploadedAssetUrl(document.signed_file_path)} target="_blank" rel="noreferrer"><FiDownload /> Signed PDF</a>}
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'upload' && isManager && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="card signing-upload-card">
                <div className="signing-table-head"><div><h3>Upload PDF</h3><p>Start a new signing workflow without leaving the ICU system shell.</p></div></div>
                {uploadError && <div className="signing-alert signing-alert--error"><FiAlertCircle /> {uploadError}</div>}
                {!uploadFile ? (
                  <button
                    type="button"
                    className={`signing-dropzone ${draggingFile ? 'dragging' : ''}`}
                    onDragOver={(event) => { event.preventDefault(); setDraggingFile(true); }}
                    onDragLeave={() => setDraggingFile(false)}
                    onDrop={(event) => { event.preventDefault(); setDraggingFile(false); attachUploadFile(event.dataTransfer.files?.[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={(event) => attachUploadFile(event.target.files?.[0])} />
                    <FiUploadCloud />
                    <strong>Drop a PDF here or browse files</strong>
                    <span>Only PDF documents are accepted by the signing backend.</span>
                  </button>
                ) : (
                  <div className="signing-upload-preview-card">
                    <div><strong>{uploadFile.name}</strong><span>{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</span></div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUploadFile(null)}><FiX /> Remove</button>
                  </div>
                )}
                <label className="form-label">Document title</label>
                <input className="input-field" value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="Board approval packet" />
                <motion.button type="button" className="btn btn-primary btn-lg signing-submit" onClick={handleUpload} disabled={uploadBusy || !uploadFile} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {uploadBusy ? <span className="spinner" /> : <FiUploadCloud />} Upload and continue
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeView === 'detail' && (
            <motion.div className="signing-detail-view" key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {detailLoading || !selectedDocument ? (
                <div className="loading-spinner"><span className="spinner" /><span>Loading document workspace...</span></div>
              ) : (
                <>
                  <div className="card signing-detail-hero">
                    <div>
                      <button type="button" className="btn btn-ghost btn-sm signing-back" onClick={() => setActiveView('documents')}>Back to documents</button>
                      <h2>{selectedDocument.title}</h2>
                      <p>Uploaded {formatSignflowDateTime(selectedDocument.created_at)} {selectedDocument.completed_at ? `• Completed ${formatSignflowDateTime(selectedDocument.completed_at)}` : ''}</p>
                    </div>
                    <div className="signing-detail-hero__actions">
                      <StatusBadge status={selectedDocument.status} />
                      <a className="btn btn-secondary btn-sm" href={buildProtectedDocumentUrl(selectedDocument.id)} target="_blank" rel="noreferrer"><FiEye /> Preview</a>
                      {selectedDocument.status === 'completed' && selectedDocument.signed_file_path && <a className="btn btn-primary btn-sm" href={buildUploadedAssetUrl(selectedDocument.signed_file_path)} target="_blank" rel="noreferrer"><FiDownload /> Signed PDF</a>}
                    </div>
                  </div>

                  <div className="signing-filter-row signing-filter-row--detail">
                    {['overview', 'signers', 'audit'].map((tab) => (
                      <button key={tab} type="button" className={`signing-filter ${detailTab === tab ? 'active' : ''}`} onClick={() => setDetailTab(tab)}>{tab}</button>
                    ))}
                  </div>

                  {detailTab === 'overview' && (
                    <div className="signing-detail-grid">
                      <div className="signing-detail-main">
                        {isOwner && !selectedDocument.manager_signed && (
                          <div className="card signing-callout">
                            <div><div className="card-title">Manager signature</div><h3>Add your signature before external approvals</h3></div>
                            <motion.button type="button" className="btn btn-primary" onClick={() => setShowSignatureModal(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><FiPenTool /> Sign document</motion.button>
                          </div>
                        )}
                        {isOwner && selectedDocument.status !== 'completed' && (
                          <div className="card signing-form-card">
                            <div className="card-title">Invite signers</div>
                            <p>Add board members or approvers, then send invitation links from the integrated workspace.</p>
                            {inviteRows.map((entry, index) => (
                              <div key={`${entry.email}-${index}`} className="signing-signer-row">
                                <input className="input-field" type="email" placeholder="board@hospital.com" value={entry.email} onChange={(event) => setInviteRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, email: event.target.value } : row))} />
                                <input className="input-field" placeholder="Full name" value={entry.name} onChange={(event) => setInviteRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} />
                                {inviteRows.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInviteRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}><FiX /></button>}
                              </div>
                            ))}
                            <div className="signing-inline-actions">
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInviteRows((current) => [...current, { email: '', name: '' }])}><FiPlus /> Add signer</button>
                              <motion.button type="button" className="btn btn-primary" onClick={handleInvite} disabled={inviteBusy || !inviteRows.some((entry) => entry.email.trim())} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                {inviteBusy ? <span className="spinner" /> : <FiSend />} Send invitations
                              </motion.button>
                            </div>
                            {inviteResult?.emailResults?.length > 0 && (
                              <div className="signing-result-list">
                                {inviteResult.emailResults.map((result) => (
                                  <div key={result.email} className={`signing-alert ${result.success ? 'signing-alert--success' : 'signing-alert--error'}`}>
                                    {result.success ? <FiCheckCircle /> : <FiAlertCircle />}
                                    {result.success ? `Invitation sent to ${result.email}` : `Failed for ${result.email}: ${result.error}`}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {isOwner && allSigned && selectedDocument.status !== 'completed' && (
                          <div className="card signing-callout signing-callout--success">
                            <div><div className="card-title">Finalize PDF</div><h3>All required signatures have been collected</h3></div>
                            <motion.button type="button" className="btn btn-primary" onClick={handleFinalize} disabled={finalizeBusy} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              {finalizeBusy ? <span className="spinner" /> : <FiCheckCircle />} Generate final PDF
                            </motion.button>
                          </div>
                        )}
                      </div>
                      <div className="signing-detail-side">
                        <div className="card signing-summary-card">
                          <div className="card-title">Document summary</div>
                          <div className="signing-summary-row"><span>Status</span><StatusBadge status={selectedDocument.status} /></div>
                          <div className="signing-summary-row"><span>Signers</span><strong>{signedCount}/{documentSigners.length} signed</strong></div>
                          <div className="signing-summary-row"><span>Manager signed</span><strong>{selectedDocument.manager_signed ? 'Yes' : 'Not yet'}</strong></div>
                        </div>
                        <div className="card signing-summary-card">
                          <div className="card-title">Live signer status</div>
                          {documentSigners.length === 0 ? <p className="signing-muted">No signers invited yet.</p> : documentSigners.map((signer) => (
                            <div key={signer.id} className="signing-person-row">
                              <div className="signing-person-row__avatar">{getSignflowInitials(signer.signer_name || signer.signer_email)}</div>
                              <div className="signing-person-row__body">
                                <strong>{signer.signer_name || signer.signer_email}</strong>
                                <span>{signer.status === 'signed' ? `Signed ${formatSignflowDateTime(signer.signed_at)}` : signer.invitation_opened_at ? 'Opened, awaiting signature' : 'Invitation pending'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {detailTab === 'signers' && (
                    <div className="card signing-table-card">
                      <table><thead><tr><th>Signer</th><th>Status</th><th>Invite sent</th><th>Opened</th><th>Signed</th>{isOwner && <th>Action</th>}</tr></thead>
                        <tbody>{documentSigners.map((signer) => (
                          <tr key={signer.id}>
                            <td><strong>{signer.signer_name || 'Unnamed signer'}</strong><div className="signing-subtle">{signer.signer_email}</div></td>
                            <td><StatusBadge status={signer.status} /></td>
                            <td>{formatSignflowDateTime(signer.invitation_sent_at)}</td>
                            <td>{formatSignflowDateTime(signer.invitation_opened_at)}</td>
                            <td>{formatSignflowDateTime(signer.signed_at)}</td>
                            {isOwner && <td>{signer.status !== 'signed' && <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleResend(signer.id)} disabled={Boolean(resending[signer.id])}>{resending[signer.id] ? <span className="spinner" /> : <FiRefreshCw />} Resend</button>}</td>}
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}

                  {detailTab === 'audit' && (
                    <div className="card signing-audit-card">
                      {auditLogs.length === 0 ? <p className="signing-muted">No activity has been recorded yet.</p> : auditLogs.map((log) => (
                        <div key={log.id} className="signing-audit-row">
                          <div className="signing-audit-row__dot" />
                          <div><strong>{SIGNFLOW_ACTION_LABELS[log.action] || log.action}</strong><span>{formatSignflowDateTime(log.created_at)} • {log.actor_email}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showSignatureModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSignatureModal(false)}>
            <motion.div className="modal signing-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(event) => event.stopPropagation()}>
              <div className="signing-modal__head">
                <div><h2>Add manager signature</h2><p>Your signature will be embedded directly into the document PDF.</p></div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSignatureModal(false)}><FiX /></button>
              </div>
              <div className="signing-signature-grid">
                <div><label className="form-label">Page</label><input className="input-field" type="number" min={1} value={signaturePosition.page} onChange={(event) => setSignaturePosition({ ...signaturePosition, page: Number(event.target.value) || 1 })} /></div>
                <div><label className="form-label">Horizontal position</label><input className="input-field" type="number" min={1} max={90} value={signaturePosition.x} onChange={(event) => setSignaturePosition({ ...signaturePosition, x: Number(event.target.value) || 65 })} /></div>
                <div><label className="form-label">Vertical position</label><input className="input-field" type="number" min={1} max={95} value={signaturePosition.y} onChange={(event) => setSignaturePosition({ ...signaturePosition, y: Number(event.target.value) || 85 })} /></div>
              </div>
              <SignaturePadLite onSignature={handleManagerSignature} disabled={signatureBusy} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
