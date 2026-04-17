const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../data/email_log.json');

function ensureLog() {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
  }
}

function logEmail({ to, subject, previewUrl, messageId, timestamp }) {
  try {
    ensureLog();
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    logs.unshift({ to, subject, previewUrl, messageId, timestamp: timestamp || new Date().toISOString() });
    // Keep last 100
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs.slice(0, 100), null, 2));
  } catch (e) {
    // Non-fatal
  }
}

function getEmailLogs() {
  try {
    ensureLog();
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

module.exports = { logEmail, getEmailLogs };
