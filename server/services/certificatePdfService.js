import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { env } from '../config/env.js'

export async function renderCertificatePdf({ certificateNumber, freelancerName, partnerId, title, issuedAt, verifyUrl }) {
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 160 })

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const { width, height } = doc.page

    doc.rect(20, 20, width - 40, height - 40).lineWidth(2).stroke('#1f2937')

    doc.fontSize(12).fillColor('#6b7280').text(env.certificate.orgName, 0, 60, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(30).fillColor('#111827').text('Certificate of Completion', { align: 'center' })
    doc.moveDown(1.5)
    doc.fontSize(14).fillColor('#374151').text('This certifies that', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(24).fillColor('#111827').text(freelancerName, { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(13).fillColor('#374151').text(`Partner ID: ${partnerId ?? '-'}`, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(16).fillColor('#111827').text(title, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(12).fillColor('#374151').text(`Issued on ${new Date(issuedAt).toDateString()}`, { align: 'center' })

    doc.fontSize(10).fillColor('#6b7280').text(`Certificate No: ${certificateNumber}`, 60, height - 120)

    doc
      .moveTo(width - 260, height - 110)
      .lineTo(width - 100, height - 110)
      .stroke('#9ca3af')
    doc
      .fontSize(10)
      .fillColor('#374151')
      .text(env.certificate.signatoryName, width - 260, height - 105, { width: 160, align: 'center' })
    doc
      .fontSize(9)
      .fillColor('#9ca3af')
      .text('Authorized Signatory', width - 260, height - 90, { width: 160, align: 'center' })

    doc.image(qrBuffer, 60, height - 190, { width: 90, height: 90 })
    doc.fontSize(8).fillColor('#9ca3af').text('Scan to verify', 60, height - 95, { width: 90, align: 'center' })

    doc.end()
  })
}
