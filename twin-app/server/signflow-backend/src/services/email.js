const nodemailer = require('nodemailer');
const { logEmail } = require('./emailLog');

const LEGACY_RESEND_API_KEY = 're_FUyxLqrE_2UmyoK6ekgMsHD8NSL1dpr92';
const DEFAULT_RESEND_FROM = 'onboarding@resend.dev';

let transporter = null;
let transporterMode = null;

const isDeliveredMode = (mode) => mode === 'resend' || mode === 'smtp';

const buildDeliveryResult = ({
  messageId,
  previewUrl = null,
  deliveryMode,
  delivered = isDeliveredMode(deliveryMode),
  reason = null,
}) => ({
  messageId,
  previewUrl,
  deliveryMode,
  delivered,
  reason,
});

const getResendApiKey = () => process.env.RESEND_API_KEY || LEGACY_RESEND_API_KEY;

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return null;
  }

  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_RESEND_FROM;
  const replyTo = process.env.RESEND_REPLY_TO || process.env.SMTP_FROM || undefined;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.error || `Resend API failed with ${response.status}`);
  }

  console.log(`[EMAIL] Resend delivered to ${to}`);
  return buildDeliveryResult({
    messageId: payload.id || `resend-${Date.now()}`,
    deliveryMode: 'resend',
  });
}

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;

  if (host && user) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: { user, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    });
    transporterMode = 'smtp';
    console.log('[EMAIL] Using configured SMTP:', host);
    return transporter;
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    transporterMode = 'ethereal';
    console.log('[EMAIL] Ethereal test account:', testAccount.user);
    console.log('[EMAIL] View sent emails at https://ethereal.email');
    return transporter;
  } catch (error) {
    console.log('[EMAIL] No network/SMTP - using file logger (dev mode)');
    transporterMode = 'log';
    transporter = {
      sendMail: async (opts) => {
        const fs = require('fs');
        const path = require('path');
        const entry = {
          ...opts,
          sentAt: new Date().toISOString(),
          messageId: `<dev-${Date.now()}@signflow.local>`,
        };
        const logFile = path.join(__dirname, '../../data/email_log.json');
        let log = [];
        try { log = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch {}
        log.push(entry);
        fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
        console.log('[EMAIL] Logged to file:', logFile);
        console.log('[EMAIL]   To:', opts.to);
        console.log('[EMAIL]   Subject:', opts.subject);
        if (opts.text) {
          const match = opts.text.match(/https?:\/\/[^\s]+/);
          if (match) console.log('[EMAIL]   Invite URL:', match[0]);
        }
        return entry;
      },
    };
    return transporter;
  }
}

function getTestMessageUrl(info) {
  if (info && info.messageId && nodemailer.getTestMessageUrl) {
    return nodemailer.getTestMessageUrl(info);
  }
  return null;
}

async function sendMail({ to, subject, html, text }) {
  const resendResult = await sendViaResend({ to, subject, html, text });
  if (resendResult) {
    return resendResult;
  }

  const mailer = await getTransporter();
  const from = process.env.SMTP_FROM || '"SignFlow" <noreply@signflow.local>';
  const info = await mailer.sendMail({ from, to, subject, html, text });
  const previewUrl = getTestMessageUrl(info);

  if (previewUrl) {
    console.log('[EMAIL] Preview:', previewUrl);
  }

  console.log('[EMAIL] Sent to', to, '- ID:', info.messageId);

  if (transporterMode === 'ethereal') {
    return buildDeliveryResult({
      messageId: info.messageId,
      previewUrl,
      deliveryMode: 'ethereal',
      delivered: false,
      reason: 'Email was sent to an Ethereal preview inbox only. Configure Resend or SMTP for real delivery.',
    });
  }

  if (transporterMode === 'log') {
    return buildDeliveryResult({
      messageId: info.messageId,
      deliveryMode: 'log',
      delivered: false,
      reason: 'Email was saved to the local dev log only. Configure Resend or SMTP for real delivery.',
    });
  }

  return buildDeliveryResult({
    messageId: info.messageId,
    previewUrl,
    deliveryMode: transporterMode || 'smtp',
  });
}

async function sendInvitationEmail({ to, documentTitle, signerName, inviteUrl, managerName }) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);padding:36px 48px;">
          <span style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Sign<span style="color:#e94560;">Flow</span></span>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Digital Signing Platform</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 48px;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">You have a document to sign</h1>
          <p style="margin:0 0 28px;color:#64748b;font-size:15px;">${managerName || 'A colleague'} has requested your signature.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:28px;">
            <p style="margin:0;font-weight:700;font-size:16px;color:#0f172a;">Document: ${documentTitle}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Awaiting your signature</p>
          </div>
          ${signerName ? `<p style="margin:0 0 20px;color:#475569;">Hi <strong>${signerName}</strong>,</p>` : ''}
          <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;">Click the button below to securely review and sign this document. This link is unique to you.</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:#e94560;border-radius:8px;">
              <a href="${inviteUrl}" style="display:block;padding:15px 32px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">Review &amp; Sign Document</a>
            </td></tr>
          </table>
          <p style="margin:0;color:#94a3b8;font-size:12px;">Or copy this link: <a href="${inviteUrl}" style="color:#e94560;">${inviteUrl}</a></p>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 48px;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">Sent via SignFlow. If you did not expect this, ignore it.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const result = await sendMail({
    to,
    subject: `[SignFlow] Please sign: ${documentTitle}`,
    html,
    text: `Sign "${documentTitle}" here: ${inviteUrl}`,
  });

  logEmail({
    to,
    subject: `[SignFlow] Please sign: ${documentTitle}`,
    previewUrl: result.previewUrl,
    messageId: result.messageId,
  });

  return result;
}

async function sendCompletionEmail({ to, documentTitle, downloadUrl }) {
  const html = `<html><body style="font-family:Helvetica,sans-serif;background:#f4f4f5;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <h1 style="color:#0f172a;">Document Fully Signed</h1>
  <p style="color:#475569;">"${documentTitle}" has been signed by all parties.</p>
  <a href="${downloadUrl}" style="display:inline-block;background:#22d3a0;color:#000;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;">View Dashboard</a>
</div></body></html>`;

  return sendMail({
    to,
    subject: `[SignFlow] Completed: ${documentTitle}`,
    html,
    text: `Document "${documentTitle}" is complete. View at: ${downloadUrl}`,
  });
}

module.exports = { sendInvitationEmail, sendCompletionEmail, getTransporter };
