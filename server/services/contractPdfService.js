import PDFDocument from 'pdfkit'

// Renders a simple, one-page record of an approved closed-deal commission
// contract — reuses the same PDFKit dependency and buffer-via-stream pattern
// as certificatePdfService.js rather than introducing a new document library.
export async function renderContractPdf({
  commissionId,
  freelancerName,
  partnerId,
  clientName,
  companyName,
  serviceInterested,
  saleValue,
  ruleRateType,
  ruleRateValue,
  commissionAmount,
  dealClosingDate,
  clientPaymentReceivedAt,
  declarationNote,
  approvedAt,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const rate = ruleRateType === 'PERCENTAGE' ? `${ruleRateValue}%` : `Rs.${ruleRateValue} fixed`

    doc.fontSize(20).fillColor('#111827').text('Commission Contract Record', { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(10).fillColor('#6b7280').text(`Contract Ref: COMM-${String(commissionId).padStart(6, '0')}`, { align: 'center' })
    doc.moveDown(1.5)

    const row = (label, value) => {
      doc.fontSize(11).fillColor('#374151').text(label, { continued: true, width: 200 })
      doc.fillColor('#111827').text(value ?? '-')
      doc.moveDown(0.4)
    }

    doc.fontSize(13).fillColor('#111827').text('Deal Details')
    doc.moveDown(0.3)
    row('Freelancer: ', `${freelancerName} (${partnerId ?? '-'})`)
    row('Client: ', `${clientName}${companyName ? ` (${companyName})` : ''}`)
    row('Service: ', serviceInterested ?? '-')
    row('Deal Value: ', `Rs.${saleValue}`)
    row('Deal Closing Date: ', dealClosingDate ? new Date(dealClosingDate).toDateString() : '-')

    doc.moveDown(0.8)
    doc.fontSize(13).fillColor('#111827').text('Commission')
    doc.moveDown(0.3)
    row('Rate: ', rate)
    row('Commission Amount: ', `Rs.${commissionAmount}`)

    doc.moveDown(0.8)
    doc.fontSize(13).fillColor('#111827').text('Payment Status')
    doc.moveDown(0.3)
    row('Client Payment Received: ', clientPaymentReceivedAt ? new Date(clientPaymentReceivedAt).toLocaleString() : 'Not yet confirmed')
    row('Contract Approved At: ', approvedAt ? new Date(approvedAt).toLocaleString() : '-')

    if (declarationNote) {
      doc.moveDown(0.8)
      doc.fontSize(13).fillColor('#111827').text('Freelancer Declaration')
      doc.moveDown(0.3)
      doc.fontSize(10).fillColor('#374151').text(declarationNote, { width: 480 })
    }

    doc.moveDown(1.2)
    doc
      .fontSize(9)
      .fillColor('#9ca3af')
      .text(
        'This record confirms the freelancer accepted the terms & conditions of the commission contract at submission time.',
        { width: 480 }
      )

    doc.end()
  })
}
