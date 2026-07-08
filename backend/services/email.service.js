// backend/services/email.service.js
// Sends transactional emails via Nodemailer (Gmail or any SMTP).
// Set EMAIL_USER and EMAIL_PASS in your .env file.
// For Gmail: use an App Password (myaccount.google.com → Security → App Passwords)

import nodemailer from "nodemailer";

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    void 0;
    return null;
  }

  _transporter = nodemailer.createTransport({
    service: "gmail",   // change to 'smtp.ethereal.email' etc. if needed
    auth: { user, pass },
  });

  return _transporter;
}

/**
 * Send an email verification link to a newly registered user.
 * @param {string} toEmail  - Recipient email address
 * @param {string} name     - Recipient display name
 * @param {string} token    - The verification token (stored in user record)
 */
export async function sendVerificationEmail(toEmail, name, token) {
  const transporter = getTransporter();
  if (!transporter) {
    void 0;
    return;
  }

  const appUrl = process.env.APP_URL || "";
  const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(toEmail)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Poppins', Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; margin: 0; padding: 0; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid rgba(124,58,237,0.3); }
    .header { background: linear-gradient(135deg, #7c3aed, #3b82f6); padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 1.5rem; letter-spacing: 1px; }
    .header .logo { font-size: 2rem; }
    .body { padding: 32px 28px; }
    .body p { color: #cbd5e1; line-height: 1.7; margin: 0 0 16px; }
    .verify-btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 1rem; margin: 8px 0 20px; }
    .url-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; font-size: 0.78rem; color: #94a3b8; word-break: break-all; margin-top: 12px; }
    .footer { padding: 20px 28px; border-top: 1px solid rgba(255,255,255,0.07); font-size: 0.78rem; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">∞</div>
      <h1>Algo Infinity Verse</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thanks for signing up! Please verify your email address to activate your account and start your DSA journey.</p>
      <div style="text-align:center; margin: 24px 0;">
        <a class="verify-btn" href="${verifyUrl}">✅ Verify My Email</a>
      </div>
      <p style="font-size:0.85rem; color:#94a3b8;">This link expires in <strong>24 hours</strong>. If you didn't sign up, you can safely ignore this email.</p>
      <p style="font-size:0.8rem; color:#64748b;">Or copy this link into your browser:</p>
      <div class="url-box">${verifyUrl}</div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Algo Infinity Verse &nbsp;|&nbsp; Master DSA. Crack Interviews.
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Algo Infinity Verse" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "✅ Verify your email — Algo Infinity Verse",
    html,
    text: `Hi ${name},\n\nVerify your email here:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });

  void 0;
}