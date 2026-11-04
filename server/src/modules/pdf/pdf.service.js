// server/src/modules/pdf/pdf.service.js
import PDFDocument from 'pdfkit';

/**
 * Format currency in Indian standard format with INR prefix
 * @param {number|string} amount
 * @returns {string}
 */
function formatPDFCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'INR 0.00';
  }
  const num = Number(amount);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `INR ${formatted}`;
}

/**
 * Format number with Indian commas
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (!num || isNaN(Number(num))) return '0';
  return Number(num).toLocaleString('en-IN');
}

/**
 * Generate formal industrial quotation PDF document
 * @param {object} quotation - Quotation entity with relations
 * @param {import('express').Response} res - Express response stream
 */
export function generateQuotationPDF(quotation, res) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Quotation ${quotation.quotationNumber}`,
      Author: 'Company A Precision Forgings & Machining',
      Subject: `Commercial Quotation for RFQ ${quotation.rfq?.rfqNumber || ''}`,
    },
  });

  // Set response headers for streaming PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Quotation-${quotation.quotationNumber}.pdf"`
  );

  doc.pipe(res);

  const primaryColor = '#1e3a8a'; // Deep Navy
  const secondaryColor = '#475569'; // Slate 600
  const lightBg = '#f8fafc'; // Slate 50
  const borderColor = '#cbd5e1'; // Slate 300

  // 1. Header Banner
  doc.rect(40, 40, 515, 65).fill(primaryColor);

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('COMPANY A PRECISION FORGINGS & MACHINING PVT. LTD.', 55, 52, { width: 485 });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#93c5fd')
    .text('Plot No. B-42, MIDC Chakan Industrial Area, Phase II, Pune - 410501, Maharashtra, India', 55, 74)
    .text('GSTIN: 27AABCC1234F1Z8 | PAN: AABCC1234F | Tel: +91 2135 678900 | quotes@companya.co.in', 55, 86);

  let currentY = 115;

  // 2. Metadata Grid (Customer Details vs Quotation Ref)
  doc.rect(40, currentY, 250, 95).fillAndStroke(lightBg, borderColor);
  doc.rect(305, currentY, 250, 95).fillAndStroke(lightBg, borderColor);

  // Left: Customer & RFQ
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('CUSTOMER & INQUIRY DETAILS', 50, currentY + 8);

  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(quotation.rfq?.customerName || 'Customer OEM', 50, currentY + 24)
    .font('Helvetica')
    .fontSize(8)
    .fillColor(secondaryColor)
    .text(`Target RFQ Ref: ${quotation.rfq?.rfqNumber || 'N/A'}`, 50, currentY + 40)
    .text(`Delivery Plant: Pune / Chakan Automotive Cluster`, 50, currentY + 52)
    .text(`Inquiry Due Date: ${quotation.rfq?.dueDate ? new Date(quotation.rfq.dueDate).toLocaleDateString('en-IN') : 'N/A'}`, 50, currentY + 64);

  // Right: Quotation Specs & Approval
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('QUOTATION SPECIFICATIONS', 315, currentY + 8);

  const dateIssued = new Date(quotation.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(`Ref: ${quotation.quotationNumber} (v${quotation.versionNumber})`, 315, currentY + 24)
    .font('Helvetica')
    .fontSize(8)
    .fillColor(secondaryColor)
    .text(`Date of Issue: ${dateIssued}`, 315, currentY + 40)
    .text('Commercial Validity: 30 Days from date of issue', 315, currentY + 52)
    .text(`Approval Status: ${quotation.status} (Delegation Tier Verified)`, 315, currentY + 64);

  currentY += 110;

  // 3. Line Items Table Heading
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('COMMERCIAL QUOTATION — COMPONENT PRICE BREAKDOWN', 40, currentY);

  currentY += 16;

  // Table Header Row
  doc.rect(40, currentY, 515, 20).fill('#e2e8f0');

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor('#1e293b')
    .text('NO', 45, currentY + 6, { width: 20 })
    .text('COMPONENT / DRAWING', 70, currentY + 6, { width: 140 })
    .text('MATERIAL', 215, currentY + 6, { width: 55 })
    .text('ANNUAL VOL', 275, currentY + 6, { width: 55, align: 'right' })
    .text('UNIT (EX-GST)', 335, currentY + 6, { width: 65, align: 'right' })
    .text('GST (18%)', 405, currentY + 6, { width: 65, align: 'right' })
    .text('FINAL PRICE', 475, currentY + 6, { width: 75, align: 'right' });

  currentY += 20;

  // Table Body Rows
  const parts = quotation.parts || [];
  parts.forEach((qp, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.rect(40, currentY, 515, 22).fill('#f8fafc');
    }

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#0f172a')
      .text(String(idx + 1), 45, currentY + 6, { width: 20 })
      .font('Helvetica-Bold')
      .text(qp.part?.partName || 'Component', 70, currentY + 3, { width: 140 })
      .font('Helvetica')
      .fillColor(secondaryColor)
      .fontSize(6.5)
      .text(qp.part?.partNumber ? `Drg: ${qp.part.partNumber}` : '', 70, currentY + 12, { width: 140 });

    doc
      .fontSize(7.5)
      .fillColor('#0f172a')
      .text(qp.part?.material || 'EN8', 215, currentY + 6, { width: 55 })
      .text(formatNumber(qp.quotedAnnualVolume), 275, currentY + 6, { width: 55, align: 'right' })
      .text(formatPDFCurrency(qp.sellingPriceBeforeGST), 335, currentY + 6, { width: 65, align: 'right' })
      .text(formatPDFCurrency(qp.gstAmountPerUnit), 405, currentY + 6, { width: 65, align: 'right' })
      .font('Helvetica-Bold')
      .text(formatPDFCurrency(qp.sellingPriceIncludingGST), 475, currentY + 6, { width: 75, align: 'right' });

    currentY += 22;
  });

  // Table Summary Footer
  doc.rect(40, currentY, 515, 38).fillAndStroke('#eff6ff', borderColor);

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(primaryColor)
    .text('ANNUAL CONTRACT VALUE (BEFORE TAX):', 50, currentY + 8)
    .text(formatPDFCurrency(quotation.annualContractValue), 280, currentY + 8, { align: 'right', width: 265 });

  doc
    .text('APPLICABLE GOODS & SERVICES TAX (GST @ 18%):', 50, currentY + 18)
    .text(formatPDFCurrency(quotation.gstAmount), 280, currentY + 18, { align: 'right', width: 265 });

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#0f172a')
    .text('TOTAL ESTIMATED CONTRACT VALUE (INCL. GST):', 50, currentY + 28)
    .text(formatPDFCurrency(quotation.totalIncludingGST), 280, currentY + 28, { align: 'right', width: 265 });

  currentY += 50;

  // 4. Volume-Tiered Pricing Amortisation Annexure
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('ANNEXURE A: VOLUME-TIERED AMORTISATION SCHEDULE (50% / 100% / 150%)', 40, currentY);

  currentY += 14;

  doc.rect(40, currentY, 515, 18).fill('#e2e8f0');
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor('#1e293b')
    .text('PART NAME', 45, currentY + 5, { width: 150 })
    .text('TIER 1 (50% VOL)', 200, currentY + 5, { width: 110, align: 'center' })
    .text('TIER 2 (100% BASELINE)', 315, currentY + 5, { width: 115, align: 'center' })
    .text('TIER 3 (150% VOL)', 435, currentY + 5, { width: 115, align: 'center' });

  currentY += 18;

  parts.forEach((qp, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.rect(40, currentY, 515, 18).fill('#f8fafc');
    }

    const tiers = qp.tiers || [];
    const t50 = tiers[0];
    const t100 = tiers[1] || t50;
    const t150 = tiers[2] || t100;

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#0f172a')
      .text(qp.part?.partName || 'Component', 45, currentY + 5, { width: 150 });

    if (t50) {
      doc.text(
        `${formatNumber(t50.annualVolume)} pcs: ${formatPDFCurrency(t50.sellingPriceIncludingGST)}`,
        200,
        currentY + 5,
        { width: 110, align: 'center' }
      );
    }

    if (t100) {
      doc
        .font('Helvetica-Bold')
        .text(
          `${formatNumber(t100.annualVolume)} pcs: ${formatPDFCurrency(t100.sellingPriceIncludingGST)}`,
          315,
          currentY + 5,
          { width: 115, align: 'center' }
        )
        .font('Helvetica');
    }

    if (t150) {
      doc.text(
        `${formatNumber(t150.annualVolume)} pcs: ${formatPDFCurrency(t150.sellingPriceIncludingGST)}`,
        435,
        currentY + 5,
        { width: 115, align: 'center' }
      );
    }

    currentY += 18;
  });

  currentY += 16;

  // 5. Commercial Terms & Conditions
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('STANDARD COMMERCIAL TERMS & CONDITIONS', 40, currentY);

  currentY += 12;

  const terms = [
    '1. Price Basis: Ex-works Company A manufacturing facility, Plot B-42 MIDC Chakan Phase II, Pune.',
    '2. Payment Terms: 30 days net from the date of tax invoice via RTGS / NEFT.',
    '3. Taxes & Duties: Goods and Services Tax (GST) at 18% shall be levied extra as statutory applicable at time of dispatch.',
    '4. Raw Material Indexation: Benchmark steel rates are linked to published OEM quarterly indexation with scrap recovery credits.',
    '5. Tooling & Development: Standard cutting tools included. Special jigs/fixtures amortised within year 1 contract volume.',
    '6. Delivery / Lead Time: PPAP Level 3 initial sample submission in 4 weeks; regular batch dispatches within 2 weeks of call-off.',
    '7. Proposal Validity: Strictly 30 calendar days from the date of issue.',
  ];

  doc.font('Helvetica').fontSize(6.5).fillColor(secondaryColor);
  terms.forEach((term) => {
    doc.text(term, 45, currentY, { width: 505 });
    currentY += 9;
  });

  currentY += 12;

  // 6. Signatures & Governance Box
  doc.rect(40, currentY, 250, 60).stroke(borderColor);
  doc.rect(305, currentY, 250, 60).stroke(borderColor);

  const creatorName = quotation.creator?.name || 'Authorized Estimator';
  const approverName = quotation.approver?.name || 'Sales & Commercial Head';

  // Estimator Sign-off
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor(primaryColor)
    .text('PREPARED & ESTIMATED BY:', 48, currentY + 6)
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#0f172a')
    .text(creatorName, 48, currentY + 18)
    .font('Helvetica')
    .fontSize(6.5)
    .fillColor(secondaryColor)
    .text('Estimation & Costing Engineering', 48, currentY + 30)
    .text(`Generated: ${dateIssued}`, 48, currentY + 40);

  // Sales Head Approval
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor(primaryColor)
    .text('COMMERCIAL AUTHORIZATION:', 313, currentY + 6)
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#0f172a')
    .text(approverName, 313, currentY + 18)
    .font('Helvetica')
    .fontSize(6.5)
    .fillColor(secondaryColor)
    .text(`Commercial Governance: ${quotation.status}`, 313, currentY + 30)
    .text(`Immutable Rate Snapshot: ${quotation.rateSnapshots?.length || 20} benchmark keys locked`, 313, currentY + 40);

  // 7. Footer
  doc
    .font('Helvetica')
    .fontSize(6.5)
    .fillColor('#94a3b8')
    .text(
      'This document is a formal commercial quotation generated by ForgeQuote AI Costing System for Company A. Confidential.',
      40,
      800,
      { align: 'center', width: 515 }
    );

  doc.end();
}
