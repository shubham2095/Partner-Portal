import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

let transporter = null

function getTransporter() {
  if (!env.smtp.host) return null

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    })
  }

  return transporter
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
    html: `<p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>.</p>`,
  })
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${env.clientUrl}/auth/reset-password?token=${token}`
  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`,
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
