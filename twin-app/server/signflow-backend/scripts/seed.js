require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { users, documents, documentSigners, auditLogs } = require('../src/services/db');

async function seed() {
  console.log('🌱 Seeding demo data...\n');

  // Manager
  let manager = users.findByEmail('manager@signflow.demo');
  if (!manager) {
    manager = users.create({
      full_name: 'Sarah Johnson',
      email: 'manager@signflow.demo',
      password_hash: await bcrypt.hash('demo1234', 10),
      role: 'manager'
    });
    console.log('✅ Created manager: manager@signflow.demo / demo1234');
  } else {
    console.log('✓  Manager already exists: manager@signflow.demo');
  }

  // Signer accounts
  const signerData = [
    { full_name: 'Michael Chen', email: 'mchen@board.demo' },
    { full_name: 'Elena Rodriguez', email: 'erodriguez@board.demo' },
  ];
  for (const s of signerData) {
    if (!users.findByEmail(s.email)) {
      users.create({ ...s, password_hash: await bcrypt.hash('demo1234', 10), role: 'signer' });
      console.log(`✅ Created signer: ${s.email} / demo1234`);
    }
  }

  // Demo document
  const existingDocs = documents.findByUploader(manager.id);
  if (existingDocs.length === 0) {
    const doc = documents.create({
      title: 'Q4 Board Resolution 2025',
      original_file_path: 'demo-placeholder.pdf',
      uploaded_by: manager.id,
      status: 'pending'
    });
    auditLogs.create({ document_id: doc.id, actor_email: manager.email, action: 'document_uploaded', metadata: '{}' });
    console.log(`✅ Created demo document: "${doc.title}"`);
  }

  console.log('\n✨ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Manager : manager@signflow.demo / demo1234');
  console.log('  Signers : mchen@board.demo / demo1234');
  console.log('            erodriguez@board.demo / demo1234');
}

seed().catch(console.error);
