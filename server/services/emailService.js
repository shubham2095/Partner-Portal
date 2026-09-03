import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

let transporter = null

function getTransporter() {
  if (!env.smtp.host) return null

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      // 465 = implicit TLS; 587/25 = STARTTLS upgrade.
      secure: env.smtp.port === 465,
      requireTLS: env.smtp.port === 587,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    })
  }

  return transporter
}

// True when real SMTP credentials are present — lets callers decide whether
// to hard-require a delivered email (e.g. block signup) or stay lenient.
export function isEmailConfigured() {
  return Boolean(env.smtp.host)
}

function brandedEmail(title, bodyHtml, cta) {
  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f6f6fb;padding:32px">
    <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e8e7f0;border-radius:16px;overflow:hidden">
      <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#d946ef,#f97316)"></div>
      <div style="padding:28px 28px 8px">
        <p style="margin:0 0 4px;font-weight:700;color:#7c3aed;font-size:13px;letter-spacing:.04em">HELTOG PARTNER PORTAL</p>
        <h1 style="margin:0 0 12px;font-size:20px;color:#1c1b29">${title}</h1>
        <div style="font-size:14px;line-height:1.6;color:#565469">${bodyHtml}</div>
        ${
          cta
            ? `<p style="margin:22px 0 8px"><a href="${cta.url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px">${cta.label}</a></p>
               <p style="margin:12px 0 0;font-size:12px;color:#9997a8;word-break:break-all">Or paste this link: ${cta.url}</p>`
            : ''
        }
      </div>
      <div style="padding:16px 28px;border-top:1px solid #e8e7f0;font-size:11px;color:#9997a8">
        You’re receiving this because someone used this address on the Heltog Partner Portal.
        If that wasn’t you, you can ignore this email.
      </div>
    </div>
  </div>`
}

export async function sendEmail({ to, subject, html }) {
  const activeTransporter = getTransporter()

  if (!activeTransporter) {
    console.log(`[emailService] SMTP not configured. Would send email to ${to}: ${subject}\n${html}`)
    return
  }

  await activeTransporter.sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.fromEmail}>`,
    to,
    subject,
    html,
  })
}

export async function sendVerificationEmail(email, token) {
  const verifyUrl = `${env.clientUrl}/auth/verify-email?token=${token}`
  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: brandedEmail(
      'Confirm your email address',
      '<p>Thanks for signing up as a partner. Confirm this is your email address to activate your account. This link expires in 48 hours.</p>',
      { url: verifyUrl, label: 'Verify email address' }
    ),
  })
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${env.clientUrl}/auth/reset-password?token=${token}`
  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: brandedEmail(
      'Reset your password',
      '<p>We received a request to reset your password. This link expires in 1 hour. If you didn’t request this, ignore this email.</p>',
      { url: resetUrl, label: 'Reset password' }
    ),
  })
}

export async function sendTestAvailableEmail(email, { testTitle }) {
  await sendEmail({
    to: email,
    subject: `New qualification test available: ${testTitle}`,
    html: `<p>A new qualification test, <strong>${testTitle}</strong>, is now available for you to attempt.</p>
           <p><a href="${env.clientUrl}/freelancer/tests">View available tests</a></p>`,
  })
}

export async function sendTestResultEmail(email, { testTitle, score, percentage, result }) {
  await sendEmail({
    to: email,
    subject: `Your result for ${testTitle}: ${result}`,
    html: `<p>You scored <strong>${score}</strong> (${percentage}%) on <strong>${testTitle}</strong>.</p>
           <p>Result: <strong>${result}</strong></p>
           <p><a href="${env.clientUrl}/freelancer/tests">View your results</a></p>`,
  })
}

export async function sendCertificateGeneratedEmail(email, { certificateNumber, title }) {
  await sendEmail({
    to: email,
    subject: `Your certificate is ready: ${title}`,
    html: `<p>Congratulations! Your certificate <strong>${certificateNumber}</strong> for <strong>${title}</strong> has been generated.</p>
           <p><a href="${env.clientUrl}/freelancer/certificates">View your certificates</a></p>`,
  })
}
