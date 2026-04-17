require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const documentRoutes = require('./src/routes/documents');

const app = express();

const isAllowedDevOrigin = (origin = '') =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === (process.env.APP_BASE_URL || 'http://localhost:5173') || isAllowedDevOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by SignFlow backend.'));
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 SignFlow backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   App URL: ${process.env.APP_BASE_URL}`);
  if (!process.env.SMTP_HOST) {
    console.log(`   📧 Email: Ethereal auto-account (check logs for preview URLs)`);
  } else {
    console.log(`   📧 Email: ${process.env.SMTP_HOST}`);
  }
});

module.exports = app;

// Dev-only: view sent email log with Ethereal preview URLs
if (process.env.NODE_ENV !== 'production') {
  const { getEmailLogs } = require('./src/services/emailLog');
  app.get('/api/dev/emails', (req, res) => {
    res.json({ emails: getEmailLogs() });
  });
  console.log('   🔧 Dev email log: http://localhost:4000/api/dev/emails');
}
