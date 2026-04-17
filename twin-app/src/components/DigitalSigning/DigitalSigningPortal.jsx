import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiFileText,
  FiShield,
  FiX,
} from 'react-icons/fi';
import SignaturePadLite from './SignaturePadLite';
import {
  buildInviteDocumentUrl,
  signflowRequest,
} from './signflowApi';
import {
  formatSignflowDateTime,
  getSignflowInitials,
} from './signflowMeta';
import './DigitalSigning.css';

export default function DigitalSigningPortal() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [doneAt, setDoneAt] = useState('');
  const [signaturePosition, setSignaturePosition] = useState({ page: 1, x: 10, y: 85 });

  useEffect(() => {
    const loadInvitation = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await signflowRequest(`/documents/invite/${token}`, {}, { includeAuth: false });
        setData(payload);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const handleSignature = async (signature) => {
    setSigning(true);
    setError('');
    try {
      await signflowRequest(`/documents/invite/${token}/sign`, {
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
      }, { includeAuth: false });
      setDoneAt(new Date().toISOString());
      setShowSignatureModal(false);
      setData((current) =>
        current
          ? {
              ...current,
              signer: { ...current.signer, status: 'signed', signed_at: new Date().toISOString() },
            }
          : current,
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="signing-portal-shell">
        <div className="loading-spinner">
          <span className="spinner" />
          <span>Loading your signing request...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="signing-portal-shell">
        <div className="card signing-portal-card signing-portal-card--center">
          <div className="signing-empty__icon"><FiShield /></div>
          <h1>Invitation unavailable</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (data?.signer?.status === 'signed') {
    return (
      <div className="signing-portal-shell">
        <div className="card signing-portal-card signing-portal-card--center">
          <div className="signing-portal-success"><FiCheckCircle /></div>
          <h1>Document signed successfully</h1>
          <p>
            Your signature for <strong>{data.document?.title}</strong> has been recorded and the
            document owner has been notified.
          </p>
          <div className="signing-portal-proof">
            <div><span>Signer</span><strong>{data.signer?.signer_email}</strong></div>
            <div><span>Recorded</span><strong>{formatSignflowDateTime(doneAt || data.signer?.signed_at)}</strong></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signing-portal-shell">
      <div className="card signing-portal-card">
        <div className="signing-portal-head">
          <div>
            <div className="card-title">ICU Digital Signing</div>
            <h1>{data?.document?.title}</h1>
            <p>
              Review the document, confirm the request details, and apply your signature from this
              secure portal.
            </p>
          </div>
          <div className="signing-chip"><FiShield /> Protected invite flow</div>
        </div>

        {error && <div className="signing-alert signing-alert--error"><FiAlertCircle /> {error}</div>}

        <div className="signing-portal-meta">
          <div className="signing-person-row">
            <div className="signing-person-row__avatar">{getSignflowInitials(data?.signer?.signer_name || data?.signer?.signer_email)}</div>
            <div className="signing-person-row__body">
              <strong>{data?.signer?.signer_name || data?.signer?.signer_email}</strong>
              <span>{data?.signer?.signer_email}</span>
            </div>
          </div>
          <div className="signing-summary-card signing-summary-card--compact">
            <div className="signing-summary-row"><span>Status</span><strong>Pending your signature</strong></div>
            <div className="signing-summary-row"><span>Requested by</span><strong>{data?.document?.uploader_name}</strong></div>
          </div>
        </div>

        <div className="card signing-portal-preview">
          <div className="signing-table-head">
            <div>
              <h3>Document preview</h3>
              <p>Open the source PDF below and verify the contents before signing.</p>
            </div>
            <a className="btn btn-secondary btn-sm" href={buildInviteDocumentUrl(token)} target="_blank" rel="noreferrer">
              <FiEye /> Open in new tab
            </a>
          </div>
          <iframe
            className="signing-portal-frame"
            src={buildInviteDocumentUrl(token)}
            title="Signing preview"
          />
        </div>

        <div className="card signing-portal-consent">
          <div className="signing-portal-consent__copy">
            <div className="card-title">Electronic signature consent</div>
            <h3>Your signature is legally binding</h3>
            <p>
              By continuing, you confirm that this electronic signature represents your intent to
              sign the document.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => setShowSignatureModal(true)}>
            <FiFileText /> Sign document
          </button>
        </div>
      </div>

      {showSignatureModal && (
        <div className="modal-overlay" onClick={() => setShowSignatureModal(false)}>
          <div className="modal signing-modal" onClick={(event) => event.stopPropagation()}>
            <div className="signing-modal__head">
              <div>
                <h2>Add your signature</h2>
                <p>Signing as {data?.signer?.signer_email}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSignatureModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="signing-signature-grid">
              <div><label className="form-label">Page</label><input className="input-field" type="number" min={1} value={signaturePosition.page} onChange={(event) => setSignaturePosition({ ...signaturePosition, page: Number(event.target.value) || 1 })} /></div>
              <div><label className="form-label">Horizontal position</label><input className="input-field" type="number" min={1} max={90} value={signaturePosition.x} onChange={(event) => setSignaturePosition({ ...signaturePosition, x: Number(event.target.value) || 10 })} /></div>
              <div><label className="form-label">Vertical position</label><input className="input-field" type="number" min={1} max={95} value={signaturePosition.y} onChange={(event) => setSignaturePosition({ ...signaturePosition, y: Number(event.target.value) || 85 })} /></div>
            </div>

            <SignaturePadLite onSignature={handleSignature} disabled={signing} />
          </div>
        </div>
      )}
    </div>
  );
}
