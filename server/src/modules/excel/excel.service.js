// server/src/modules/excel/excel.service.js
import ExcelJS from 'exceljs';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';

/**
 * Generate an industrial Bill of Materials and Routing Excel Workbook for an RFQ.
 * @param {string} rfqId - The RFQ UUID
 * @returns {Promise<ExcelJS.Workbook>}
 */
export async function generateRFQExcel(rfqId) {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: {
      owner: { select: { name: true, email: true } },
      parts: {
        include: {
          operations: {
            orderBy: { operationSequence: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!rfq) throw new NotFoundError('RFQ');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ForgeQuote — Company A, Chakan';
  workbook.lastModifiedBy = 'ForgeQuote System';
  workbook.created = new Date();

  // ── Sheet 1: Parts & Bill of Materials ────────────────────────
  const partsSheet = workbook.addWorksheet('BOM & Parts Register', {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  partsSheet.mergeCells('A1:H1');
  const titleCell = partsSheet.getCell('A1');
  titleCell.value = 'COMPANY A — PRECISION MACHINING & FORGING (CHAKAN, PUNE)';
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  partsSheet.getRow(1).height = 28;

  // Metadata Subtitle
  partsSheet.mergeCells('A2:H2');
  const subCell = partsSheet.getCell('A2');
  subCell.value = `RFQ Inquiry: ${rfq.rfqNumber}  |  Customer: ${rfq.customerName}  |  Status: ${rfq.status}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  partsSheet.getRow(2).height = 20;

  partsSheet.addRow([]); // Blank row 3

  // Table Headers
  const headerRow = partsSheet.addRow([
    'Item #',
    'Part Number',
    'Component Name',
    'Material Grade',
    'Net Weight (kg)',
    'Scrap Recovery (%)',
    'Gross Weight (kg)',
    'Annual Volume (units)',
  ]);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Populate Parts Rows
  rfq.parts.forEach((part, index) => {
    const net = parseFloat(part.netWeightKg) || 0;
    const scrap = parseFloat(part.scrapPercentage) || 0;
    const gross = part.grossWeightKg
      ? parseFloat(part.grossWeightKg)
      : parseFloat((net / (1 - scrap / 100)).toFixed(4));

    const row = partsSheet.addRow([
      index + 1,
      part.partNumber || `PART-${index + 1}`,
      part.partName,
      part.material || 'EN8',
      net,
      scrap,
      gross,
      part.annualVolume || 0,
    ]);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: colNumber > 4 ? 'right' : 'left' };
      if (colNumber === 1) cell.alignment.horizontal = 'center';
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  });

  // Auto-fit Columns
  partsSheet.columns = [
    { width: 8 },  // Item #
    { width: 18 }, // Part Number
    { width: 28 }, // Component Name
    { width: 18 }, // Material
    { width: 16 }, // Net Weight
    { width: 18 }, // Scrap
    { width: 18 }, // Gross Weight
    { width: 22 }, // Volume
  ];

  // ── Sheet 2: Routing Operations ───────────────────────────────
  const routingSheet = workbook.addWorksheet('Manufacturing Operations', {
    views: [{ showGridLines: true }],
  });

  // Routing Title
  routingSheet.mergeCells('A1:G1');
  const rTitle = routingSheet.getCell('A1');
  rTitle.value = `Manufacturing Routing Plan — ${rfq.rfqNumber}`;
  rTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  rTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  rTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  routingSheet.getRow(1).height = 26;

  routingSheet.addRow([]);

  const rHeader = routingSheet.addRow([
    'Component',
    'Op Seq',
    'Operation Description',
    'Machine Center',
    'Cycle Time (min)',
    'Machine Rate (₹/hr)',
    'Setup Hours',
  ]);
  rHeader.height = 22;
  rHeader.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  rfq.parts.forEach((part) => {
    (part.operations || []).forEach((op) => {
      const row = routingSheet.addRow([
        part.partName,
        op.operationSequence,
        op.operationName,
        op.machineType,
        parseFloat(op.cycleTimeMinutes) || 0,
        parseFloat(op.machineHourRate) || 0,
        parseFloat(op.setupHours) || 0,
      ]);
      row.height = 19;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9.5 };
        cell.alignment = { vertical: 'middle', horizontal: colNumber >= 5 ? 'right' : 'left' };
        if (colNumber === 2) cell.alignment.horizontal = 'center';
      });
    });
  });

  routingSheet.columns = [
    { width: 26 }, // Component
    { width: 10 }, // Seq
    { width: 30 }, // Op Name
    { width: 20 }, // Machine
    { width: 16 }, // Cycle Time
    { width: 20 }, // Rate
    { width: 14 }, // Setup
  ];

  return workbook;
}
