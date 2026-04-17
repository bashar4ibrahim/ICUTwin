const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const adapter = new FileSync(path.join(__dirname, '../../data/db.json'));
const db = low(adapter);

// Initialize default structure
db.defaults({
  users: [],
  documents: [],
  document_signers: [],
  signatures: [],
  audit_logs: []
}).write();

// --- Users ---
const users = {
  findByEmail: (email) => db.get('users').find({ email }).value(),
  findById: (id) => db.get('users').find({ id }).value(),
  create: (data) => {
    const user = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
    db.get('users').push(user).write();
    return user;
  },
  getAll: () => db.get('users').value()
};

// --- Documents ---
const documents = {
  findById: (id) => db.get('documents').find({ id }).value(),
  findByUploader: (uploaded_by) => db.get('documents').filter({ uploaded_by }).value(),
  create: (data) => {
    const doc = { id: uuidv4(), created_at: new Date().toISOString(), status: 'draft', ...data };
    db.get('documents').push(doc).write();
    return doc;
  },
  update: (id, data) => {
    db.get('documents').find({ id }).assign(data).write();
    return db.get('documents').find({ id }).value();
  },
  getAll: () => db.get('documents').value()
};

// --- Document Signers ---
const documentSigners = {
  findById: (id) => db.get('document_signers').find({ id }).value(),
  findByToken: (invitation_token) => db.get('document_signers').find({ invitation_token }).value(),
  findByDocument: (document_id) => db.get('document_signers').filter({ document_id }).value(),
  findByDocumentAndEmail: (document_id, signer_email) =>
    db.get('document_signers').find({ document_id, signer_email }).value(),
  create: (data) => {
    const signer = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      status: 'pending',
      ...data
    };
    db.get('document_signers').push(signer).write();
    return signer;
  },
  update: (id, data) => {
    db.get('document_signers').find({ id }).assign(data).write();
    return db.get('document_signers').find({ id }).value();
  }
};

// --- Signatures ---
const signatures = {
  findByDocument: (document_id) => db.get('signatures').filter({ document_id }).value(),
  findBySigner: (signer_id) => db.get('signatures').filter({ signer_id }).value(),
  create: (data) => {
    const sig = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
    db.get('signatures').push(sig).write();
    return sig;
  }
};

// --- Audit Logs ---
const auditLogs = {
  findByDocument: (document_id) =>
    db.get('audit_logs').filter({ document_id }).orderBy(['created_at'], ['asc']).value(),
  create: (data) => {
    const log = { id: uuidv4(), created_at: new Date().toISOString(), ...data };
    db.get('audit_logs').push(log).write();
    return log;
  }
};

module.exports = { users, documents, documentSigners, signatures, auditLogs, db };
