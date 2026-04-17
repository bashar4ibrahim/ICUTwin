export const SIGNFLOW_ACTION_LABELS = {
  document_uploaded: 'Document uploaded',
  manager_signed: 'Manager signature recorded',
  invitation_sent: 'Invitation sent',
  invitation_resent: 'Invitation resent',
  invitation_opened: 'Invitation opened',
  document_viewed: 'Signer viewed document',
  signer_signed: 'Signer signature recorded',
  document_completed: 'Document completed',
  document_finalized: 'Final PDF generated',
};

export const formatSignflowDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatSignflowDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getSignedCount = (signers = []) => signers.filter((signer) => signer.status === 'signed').length;

export const getSignflowInitials = (value = '') =>
  String(value)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SF';
