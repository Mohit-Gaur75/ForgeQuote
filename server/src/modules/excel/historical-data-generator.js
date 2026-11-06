// server/src/modules/excel/historical-data-generator.js
import ExcelJS from 'exceljs';

const PUNE_CUSTOMERS = [
  'Bajaj Auto Ltd (Akurdi & Chakan)',
  'Mahindra & Mahindra Farm Equipment (Nagpur/Pune)',
  'Tata Motors Commercial Vehicles (Pimpri)',
  'Bharat Forge Ltd (Mundhwa)',
  'Carraro India (Ranjangaon)',
  'Dana TM4 India (Chakan)',
  'John Deere India (Sanand/Pune)',
  'Kalyani Technoforge (Chakan)',
  'Varroc Engineering (Chakan)',
  'Endurance Technologies (Chakan)',
];

const COMPONENT_ARCHETYPES = [
  { name: 'Rear Wheel Spindle', grade: 'EN8', minW: 0.55, maxW: 0.75, minCycle: 2.8, maxCycle: 4.0, machine: 'CNC Lathe', rate: 850 },
  { name: 'Front Axle Spindle', grade: 'EN8', minW: 0.80, maxW: 1.20, minCycle: 3.5, maxCycle: 5.5, machine: 'CNC Lathe', rate: 850 },
  { name: 'Hydraulic Lift Arm', grade: '40Cr4', minW: 4.20, maxW: 5.10, minCycle: 10.0, maxCycle: 14.0, machine: 'HMC', rate: 1450 },
  { name: 'Steering Knuckle', grade: '40Cr4', minW: 3.50, maxW: 4.50, minCycle: 8.5, maxCycle: 12.0, machine: 'VMC 4-Axis', rate: 750 },
  { name: 'Differential Gear Blank', grade: '20MnCr5', minW: 1.30, maxW: 1.70, minCycle: 4.2, maxCycle: 6.0, machine: 'CNC Lathe', rate: 950 },
  { name: 'Crown Wheel Blank', grade: '20MnCr5', minW: 4.80, maxW: 6.50, minCycle: 12.0, maxCycle: 18.0, machine: 'VMC 4-Axis', rate: 950 },
  { name: 'Counter Shaft', grade: 'EN19', minW: 1.80, maxW: 2.60, minCycle: 5.5, maxCycle: 8.0, machine: 'CNC Lathe', rate: 850 },
  { name: 'Pinion Shaft', grade: 'EN19', minW: 2.20, maxW: 3.10, minCycle: 6.0, maxCycle: 9.5, machine: 'CNC Lathe', rate: 850 },
  { name: 'Connecting Rod Pin', grade: '16MnCr5', minW: 0.35, maxW: 0.65, minCycle: 1.8, maxCycle: 3.0, machine: 'Surface Grinder', rate: 350 },
  { name: 'Main Drive Flange', grade: 'C45', minW: 1.10, maxW: 1.60, minCycle: 3.8, maxCycle: 5.2, machine: 'CNC Lathe', rate: 650 },
  { name: 'Hydraulic Cylinder Cap', grade: 'SS304', minW: 1.40, maxW: 2.20, minCycle: 6.5, maxCycle: 10.0, machine: 'VMC 3-Axis', rate: 650 },
  { name: 'Transmission Shift Fork', grade: '40Cr4', minW: 0.85, maxW: 1.35, minCycle: 4.5, maxCycle: 7.0, machine: 'VMC 4-Axis', rate: 750 },
  { name: 'Flywheel Ring Gear Blank', grade: 'C45', minW: 3.20, maxW: 4.50, minCycle: 8.0, maxCycle: 12.0, machine: 'CNC Lathe', rate: 850 },
  { name: 'Brake Drum Hub', grade: 'EN8', minW: 5.50, maxW: 8.20, minCycle: 14.0, maxCycle: 20.0, machine: 'HMC', rate: 1450 },
];

/**
 * Generate a 1,400-row historical quotes Excel workbook.
 * @param {number} count - Total rows to generate (default 1400)
 * @returns {ExcelJS.Workbook}
 */
export function buildHistoricalWorkbook(count = 1400) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Company A — Estimation ERP Archive';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Historical Quotations (1400)', {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  sheet.mergeCells('A1:N1');
  const title = sheet.getCell('A1');
  title.value = 'COMPANY A — HISTORICAL QUOTATIONS ARCHIVE (CHAKAN, PUNE)';
  title.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 26;

  // Header Row
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
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  const baseDate = new Date('2025-01-10');

  for (let i = 1; i <= count; i++) {
    const custIndex = (i * 7) % PUNE_CUSTOMERS.length;
    const archIndex = (i * 13) % COMPONENT_ARCHETYPES.length;

    const customer = PUNE_CUSTOMERS[custIndex];
    const arch = COMPONENT_ARCHETYPES[archIndex];

    const quoteYear = 2025;
    const quoteNum = `QT-${quoteYear}-${String(i).padStart(4, '0')}`;
    const partNum = `PRT-${quoteYear}-${String(i).padStart(4, '0')}`;

    // Deterministic variation using index
    const weightFactor = 1 + ((i % 17) - 8) * 0.02;
    const netWeight = parseFloat((arch.minW * weightFactor).toFixed(3));
    const scrapPct = 5.0 + (i % 4);
    const grossWeight = parseFloat((netWeight / (1 - scrapPct / 100)).toFixed(3));

    const volSteps = [15000, 24000, 48000, 60000, 90000, 120000, 180000, 240000];
    const annualVolume = volSteps[i % volSteps.length];

    const cycleTime = parseFloat((arch.minCycle * (1 + ((i % 11) - 5) * 0.03)).toFixed(2));
    const machineRate = arch.rate;

    // Approximate unit price formula: material + (cycle/60 * rate) + overhead + margin
    const matRateKg = arch.grade === 'EN8' ? 85 : arch.grade === '40Cr4' ? 110 : 125;
    const matCost = grossWeight * matRateKg;
    const convCost = (cycleTime / 60) * machineRate;
    const totalCost = matCost + convCost + 10;
    const quotedUnitPrice = parseFloat((totalCost / 0.85).toFixed(2));

    // Staggered dates throughout 2025
    const rowDate = new Date(baseDate.getTime() + (i * 24 * 60 * 60 * 1000 * 350) / count);
    const dateStr = rowDate.toISOString().split('T')[0];

    const row = sheet.addRow([
      quoteNum,
      customer,
      partNum,
      `${arch.name} ${String.fromCharCode(65 + (i % 6))}`,
      arch.grade,
      netWeight,
      grossWeight,
      scrapPct,
      annualVolume,
      quotedUnitPrice,
      arch.machine,
      cycleTime,
      machineRate,
      dateStr,
    ]);

    row.height = 18;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: colNumber >= 6 && colNumber <= 13 ? 'right' : 'left' };
      if (colNumber === 1 || colNumber === 14) cell.alignment.horizontal = 'center';
      if (i % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  }

  sheet.columns = [
    { width: 16 }, // Quote No
    { width: 34 }, // Customer
    { width: 18 }, // Part Number
    { width: 28 }, // Part Name
    { width: 16 }, // Material
    { width: 14 }, // Net Wt
    { width: 16 }, // Gross Wt
    { width: 12 }, // Scrap
    { width: 16 }, // Volume
    { width: 22 }, // Quoted Price
    { width: 18 }, // Machine
    { width: 16 }, // Cycle Time
    { width: 18 }, // Rate
    { width: 14 }, // Date
  ];

  return workbook;
}
