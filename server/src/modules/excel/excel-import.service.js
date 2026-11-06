// server/src/modules/excel/excel-import.service.js
import ExcelJS from 'exceljs';
import { prisma } from '../../config/database.js';
import { buildHistoricalWorkbook } from './historical-data-generator.js';
import { ValidationError } from '../../utils/errors.js';

/**
 * Import historical quotations and parts from an Excel (.xlsx) buffer into PostgreSQL.
 * @param {Buffer} buffer - Binary XLSX file buffer
 * @param {Object} user - Authenticated user executing the import
 * @returns {Promise<Object>} Import summary stats
 */
export async function importHistoricalQuotesFromBuffer(buffer, user) {
  if (!buffer || buffer.length === 0) {
    throw new ValidationError('Uploaded file is empty or corrupted');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new ValidationError('Excel workbook contains no readable sheets');
  }

  const parsedRows = [];

  sheet.eachRow((row, rowNumber) => {
    // Skip banner and header rows (rows 1 and 2)
    if (rowNumber <= 2) return;

    const quoteNo = row.getCell(1).text?.trim();
    const customer = row.getCell(2).text?.trim();
    const partNum = row.getCell(3).text?.trim();
    const partName = row.getCell(4).text?.trim();
    const material = row.getCell(5).text?.trim();
    const netWeight = parseFloat(row.getCell(6).value) || 0;
    const grossWeight = parseFloat(row.getCell(7).value) || 0;
    const scrapPct = parseFloat(row.getCell(8).value) || 5.0;
    const volume = parseInt(row.getCell(9).value, 10) || 10000;
    const unitPrice = parseFloat(row.getCell(10).value) || 0;
    const machine = row.getCell(11).text?.trim() || 'CNC Lathe';
    const cycleTime = parseFloat(row.getCell(12).value) || 3.0;
    const machineRate = parseFloat(row.getCell(13).value) || 850;
    const dateStr = row.getCell(14).text?.trim() || '2025-06-01';

    if (partName && netWeight > 0) {
      parsedRows.push({
        quoteNo: quoteNo || `QT-2025-${String(rowNumber).padStart(4, '0')}`,
        customer: customer || 'Pune Tier-1 Automotive OEM',
        partNum: partNum || `PRT-2025-${String(rowNumber).padStart(4, '0')}`,
        partName,
        material: material || 'EN8',
        netWeight,
        grossWeight: grossWeight > 0 ? grossWeight : parseFloat((netWeight / (1 - scrapPct / 100)).toFixed(4)),
        scrapPct,
        volume,
        unitPrice,
        machine,
        cycleTime,
        machineRate,
        date: new Date(dateStr),
      });
    }
  });

  if (parsedRows.length === 0) {
    throw new ValidationError('No valid part or quotation data rows found in Excel sheet.');
  }

  // Chunk processing in batches of 50 for database performance and transaction safety
  const CHUNK_SIZE = 50;
  let importedCount = 0;

  for (let i = 0; i < parsedRows.length; i += CHUNK_SIZE) {
    const chunk = parsedRows.slice(i, i + CHUNK_SIZE);

    await prisma.$transaction(async (tx) => {
      for (const item of chunk) {
        // 1. Create or connect historical RFQ
        const rfqNumber = item.quoteNo.replace('QT-', 'RFQ-');
        let rfq = await tx.rFQ.findUnique({
          where: { rfqNumber },
        });

        if (!rfq) {
          rfq = await tx.rFQ.create({
            data: {
              rfqNumber,
              customerName: item.customer,
              customerType: 'Automotive / Tractor OEM',
              receivedAt: item.date,
              dueDate: new Date(item.date.getTime() + 14 * 24 * 60 * 60 * 1000),
              ownerId: user.id,
              status: 'WON',
            },
          });
        }

        // 2. Create Part
        const part = await tx.part.create({
          data: {
            rfq: { connect: { id: rfq.id } },
            partNumber: item.partNum,
            partName: item.partName,
            material: item.material,
            netWeightKg: item.netWeight,
            grossWeightKg: item.grossWeight,
            scrapPercentage: item.scrapPct,
            annualVolume: item.volume,
            setupHours: 1.0,
            createdAt: item.date,
          },
        });

        // 3. Create Manufacturing Operation
        await tx.partOperation.create({
          data: {
            part: { connect: { id: part.id } },
            operationSequence: 10,
            operationName: `CNC / Machining — ${item.machine}`,
            machineType: item.machine,
            cycleTimeMinutes: item.cycleTime,
            machineHourRate: item.machineRate,
            setupHours: 1.0,
          },
        });

        // 4. Create Historical Quotation record
        const annualValue = parseFloat((item.unitPrice * item.volume).toFixed(2));
        let quoteNumber = item.quoteNo;
        const existingQuote = await tx.quotation.findUnique({
          where: { quotationNumber: quoteNumber },
        });
        if (existingQuote) {
          quoteNumber = `${item.quoteNo}-R${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        }

        const quote = await tx.quotation.create({
          data: {
            rfq: { connect: { id: rfq.id } },
            quotationNumber: quoteNumber,
            versionNumber: 1,
            status: 'SENT',
            subtotalBeforeTax: item.unitPrice,
            annualContractValue: annualValue,
            marginPercentage: 15.0,
            gstPercentage: 18.0,
            gstAmount: parseFloat((item.unitPrice * 0.18).toFixed(2)),
            totalIncludingGST: parseFloat((item.unitPrice * 1.18).toFixed(2)),
            creator: { connect: { id: user.id } },
            createdAt: item.date,
          },
        });

        // 5. Create QuotationPart link
        await tx.quotationPart.create({
          data: {
            quotation: { connect: { id: quote.id } },
            part: { connect: { id: part.id } },
            quotedAnnualVolume: item.volume,
            materialCost: parseFloat((item.netWeight * 85).toFixed(2)),
            conversionCost: parseFloat(((item.cycleTime / 60) * item.machineRate).toFixed(2)),
            setupCost: 0.1,
            overheadCost: 5.0,
            packingCost: 4.0,
            freightCost: 2.0,
            totalCostPerUnit: parseFloat((item.unitPrice * 0.85).toFixed(2)),
            marginPercentage: 15.0,
            sellingPriceBeforeGST: item.unitPrice,
            gstAmountPerUnit: parseFloat((item.unitPrice * 0.18).toFixed(2)),
            sellingPriceIncludingGST: parseFloat((item.unitPrice * 1.18).toFixed(2)),
          },
        });

        importedCount++;
      }
    });
  }

  // Record Audit Log entry for the bulk import
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'EXCEL_HISTORICAL_QUOTES_IMPORTED',
      entityType: 'QUOTATION',
      entityId: user.id,
      newValues: {
        totalRowsImported: importedCount,
        importedAt: new Date().toISOString(),
      },
    },
  });

  return {
    success: true,
    importedCount,
    message: `Successfully imported ${importedCount} historical quotation and routing records from Excel archive into PostgreSQL.`,
  };
}

/**
 * 1-Click demo import of 1,400 historical past quotes.
 * @param {Object} user
 */
export async function importSample1400Archive(user) {
  const workbook = buildHistoricalWorkbook(1400);
  const buffer = await workbook.xlsx.writeBuffer();
  return importHistoricalQuotesFromBuffer(Buffer.from(buffer), user);
}

/**
 * Build a downloadable blank template for customer/estimator quote imports.
 */
export function buildBlankQuoteTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Quote Import Template');

  sheet.mergeCells('A1:N1');
  const title = sheet.getCell('A1');
  title.value = 'COMPANY A — PAST QUOTATION IMPORT TEMPLATE (CHAKAN, PUNE)';
  title.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 26;

  const headers = [
    'Quote No',
    'Customer Name',
    'Part Number',
    'Part Name',
    'Material Grade',
    'Net Weight (kg)',
    'Gross Weight (kg)',
    'Scrap (%)',
    'Annual Volume',
    'Quoted Unit Price (INR)',
    'Machine Center',
    'Cycle Time (min)',
    'Machine Rate (INR/hr)',
    'Quote Date',
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Example demonstration row
  sheet.addRow([
    'QT-2025-0001',
    'Bajaj Auto Ltd (Chakan)',
    'PRT-2025-0001',
    'Rear Wheel Spindle A',
    'EN8',
    0.61,
    0.642,
    5.0,
    180000,
    149.56,
    'CNC Lathe',
    3.2,
    850,
    '2025-02-15',
  ]);

  sheet.columns = [
    { width: 16 }, { width: 32 }, { width: 18 }, { width: 28 }, { width: 16 },
    { width: 14 }, { width: 16 }, { width: 12 }, { width: 16 }, { width: 22 },
    { width: 18 }, { width: 16 }, { width: 18 }, { width: 14 },
  ];

  return workbook;
}
