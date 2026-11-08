// server/prisma/seed.js
import '../src/config/env.js';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function hashPassword(plaintext) {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main() {
  console.log('🌱 Starting idempotent database seeding...');

  // 1. Users (All 4 Personas from the Problem Statement)
  const estimatorPasswordHash = await hashPassword(process.env.SEED_ESTIMATOR_PASSWORD || 'Estimator@123');
  const salesPasswordHash = await hashPassword(process.env.SEED_SALES_PASSWORD || 'Sales@123');
  const plantHeadPasswordHash = await hashPassword(process.env.SEED_PLANTHEAD_PASSWORD || 'PlantHead@123');
  const mdPasswordHash = await hashPassword(process.env.SEED_MD_PASSWORD || 'MD@123');

  const estimator = await prisma.user.upsert({
    where: { email: 'estimator@forgequote.demo' },
    update: { passwordHash: estimatorPasswordHash, isActive: true },
    create: {
      name: 'Rajesh Kumar (Senior Estimator)',
      email: 'estimator@forgequote.demo',
      passwordHash: estimatorPasswordHash,
      role: 'ESTIMATOR',
      isActive: true,
    },
  });

  const salesHead = await prisma.user.upsert({
    where: { email: 'sales@forgequote.demo' },
    update: { passwordHash: salesPasswordHash, isActive: true },
    create: {
      name: 'Anil Deshmukh (Head of Commercial Sales)',
      email: 'sales@forgequote.demo',
      passwordHash: salesPasswordHash,
      role: 'SALES_HEAD',
      isActive: true,
    },
  });

  const plantHead = await prisma.user.upsert({
    where: { email: 'planthead@forgequote.demo' },
    update: { passwordHash: plantHeadPasswordHash, isActive: true },
    create: {
      name: 'Vikram Shinde (Plant Head — Chakan Works)',
      email: 'planthead@forgequote.demo',
      passwordHash: plantHeadPasswordHash,
      role: 'PLANT_HEAD',
      isActive: true,
    },
  });

  const managingDirector = await prisma.user.upsert({
    where: { email: 'md@forgequote.demo' },
    update: { passwordHash: mdPasswordHash, isActive: true },
    create: {
      name: 'Suresh Patil (Managing Director)',
      email: 'md@forgequote.demo',
      passwordHash: mdPasswordHash,
      role: 'MANAGING_DIRECTOR',
      isActive: true,
    },
  });

  console.log(`✓ Seeded users: ${estimator.email}, ${salesHead.email}, ${plantHead.email}, ${managingDirector.email}`);

  // 2. Rate Masters (Multiple versions with non-overlapping effective dates)
  const baseRates = [
    // Material rates
    { rateType: 'MATERIAL', rateName: 'EN8 Bright Bar', materialGrade: 'EN8', rateValue: '85.0000', unit: 'INR/kg', versionNumber: 1, from: '2026-01-01', to: '2026-06-30' },
    { rateType: 'MATERIAL', rateName: 'EN8 Bright Bar', materialGrade: 'EN8', rateValue: '85.0000', unit: 'INR/kg', versionNumber: 2, from: '2026-07-01', to: null },
    { rateType: 'MATERIAL', rateName: '40Cr4 Alloy Steel', materialGrade: '40Cr4', rateValue: '110.0000', unit: 'INR/kg', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'MATERIAL', rateName: '20MnCr5 Case Hardening', materialGrade: '20MnCr5', rateValue: '125.0000', unit: 'INR/kg', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'MATERIAL', rateName: 'SS304 Stainless Steel', materialGrade: 'SS304', rateValue: '280.0000', unit: 'INR/kg', versionNumber: 1, from: '2026-01-01', to: null },

    // Machine-hour rates
    { rateType: 'MACHINE_HOUR', rateName: 'CNC Turning Center (2-Axis)', machineType: 'CNC Lathe', rateValue: '850.0000', unit: 'INR/hr', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'MACHINE_HOUR', rateName: 'VMC 3-Axis Machining Center', machineType: 'VMC 3-Axis', rateValue: '950.0000', unit: 'INR/hr', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'MACHINE_HOUR', rateName: 'VMC 4-Axis Machining Center', machineType: 'VMC 4-Axis', rateValue: '1200.0000', unit: 'INR/hr', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'MACHINE_HOUR', rateName: 'Heavy Forging Press 1600T', machineType: 'Forging Press 1600T', rateValue: '1450.0000', unit: 'INR/hr', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'MACHINE_HOUR', rateName: 'CNC Cylindrical Grinding', machineType: 'Cylindrical Grinder', rateValue: '750.0000', unit: 'INR/hr', versionNumber: 1, from: '2026-01-01', to: null },

    // Factory Overheads
    { rateType: 'OVERHEAD', rateName: 'Standard Machining Overhead', rateValue: '4.0000', unit: '%', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'OVERHEAD', rateName: 'Heavy Forging Plant Overhead', rateValue: '8.0000', unit: '%', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'OVERHEAD', rateName: 'Transmission Component Overhead', rateValue: '6.0000', unit: '%', versionNumber: 1, from: '2026-01-01', to: null },

    // Packing
    { rateType: 'PACKING', rateName: 'Small Shaft VCI Corrugated Pack', rateValue: '4.0000', unit: 'INR/unit', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'PACKING', rateName: 'Heavy Arm Heavy-Duty Pallet Pack', rateValue: '12.0000', unit: 'INR/unit', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'PACKING', rateName: 'Gear Blank Layered Separator Pack', rateValue: '7.0000', unit: 'INR/unit', versionNumber: 1, from: '2026-01-01', to: null },

    // Freight
    { rateType: 'FREIGHT', rateName: 'Chakan to Pune Local OEM Freight', rateValue: '2.0000', unit: 'INR/unit', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'FREIGHT', rateName: 'Chakan to Nashik Tractor Division', rateValue: '6.0000', unit: 'INR/unit', versionNumber: 1, from: '2026-01-01', to: null },
    { rateType: 'FREIGHT', rateName: 'Chakan to Aurangabad Plant Freight', rateValue: '3.0000', unit: 'INR/unit', versionNumber: 1, from: '2026-01-01', to: null },

    // GST
    { rateType: 'GST', rateName: 'Automotive Component GST (Standard)', rateValue: '18.0000', unit: '%', versionNumber: 1, from: '2026-01-01', to: null },
  ];

  const rateRecords = [];
  for (const r of baseRates) {
    const existing = await prisma.rateMaster.findFirst({
      where: {
        rateType: r.rateType,
        rateName: r.rateName,
        versionNumber: r.versionNumber,
      },
    });

    if (!existing) {
      const created = await prisma.rateMaster.create({
        data: {
          rateType: r.rateType,
          rateName: r.rateName,
          materialGrade: r.materialGrade || null,
          machineType: r.machineType || null,
          rateValue: r.rateValue,
          unit: r.unit,
          versionNumber: r.versionNumber,
          effectiveFrom: new Date(r.from),
          effectiveTo: r.to ? new Date(r.to) : null,
          isActive: true,
          createdBy: salesHead.id,
        },
      });
      rateRecords.push(created);
    } else {
      rateRecords.push(existing);
    }
  }
  console.log(`✓ Seeded ${rateRecords.length} rate master records with versions`);

  // Helper rate map for lookups
  const cncRate = rateRecords.find(r => r.machineType === 'CNC Lathe');
  const forgeRate = rateRecords.find(r => r.machineType === 'Forging Press 1600T');
  const vmcRate = rateRecords.find(r => r.machineType === 'VMC 3-Axis');

  // 3. Seed 8 RFQs (including 1 overdue, multiple customers)
  const customers = [
    { name: 'Bajaj Auto Ltd (Akurdi)', type: 'Two-Wheeler OEM' },
    { name: 'Mahindra Tractors (Nagpur)', type: 'Tractor & Farm Equipment' },
    { name: 'Tata Motors Tier-1 Transmission', type: 'Automotive OEM' },
  ];

  const rfqDefinitions = [
    {
      rfqNumber: 'RFQ-2026-0001',
      customerName: customers[0].name,
      customerType: customers[0].type,
      receivedAt: '2026-10-15T10:00:00Z',
      dueDate: '2026-11-20T18:00:00Z',
      status: 'ESTIMATING',
    },
    {
      rfqNumber: 'RFQ-2026-0002',
      customerName: customers[1].name,
      customerType: customers[1].type,
      receivedAt: '2026-10-18T09:30:00Z',
      dueDate: '2026-11-25T18:00:00Z',
      status: 'ESTIMATING',
    },
    {
      rfqNumber: 'RFQ-2026-0003',
      customerName: customers[2].name,
      customerType: customers[2].type,
      receivedAt: '2026-10-20T14:00:00Z',
      dueDate: '2026-11-28T18:00:00Z',
      status: 'ESTIMATING',
    },
    {
      // OVERDUE RFQ: Due date in past, status ESTIMATING
      rfqNumber: 'RFQ-2026-0004',
      customerName: customers[0].name,
      customerType: customers[0].type,
      receivedAt: '2026-10-01T08:00:00Z',
      dueDate: '2026-10-25T18:00:00Z', // Overdue
      status: 'ESTIMATING',
    },
    {
      rfqNumber: 'RFQ-2026-0005',
      customerName: customers[1].name,
      customerType: customers[1].type,
      receivedAt: '2026-10-05T11:00:00Z',
      dueDate: '2026-10-30T18:00:00Z',
      status: 'SENT',
    },
    {
      rfqNumber: 'RFQ-2026-0006',
      customerName: customers[2].name,
      customerType: customers[2].type,
      receivedAt: '2026-09-15T10:00:00Z',
      dueDate: '2026-10-10T18:00:00Z',
      status: 'WON',
    },
    {
      rfqNumber: 'RFQ-2026-0007',
      customerName: customers[0].name,
      customerType: customers[0].type,
      receivedAt: '2026-09-10T15:00:00Z',
      dueDate: '2026-09-28T18:00:00Z',
      status: 'LOST',
      lostReason: 'Competitor quoted 4% lower conversion rate due to multi-spindle line',
    },
    {
      rfqNumber: 'RFQ-2026-0008',
      customerName: customers[1].name,
      customerType: customers[1].type,
      receivedAt: '2026-10-28T12:00:00Z',
      dueDate: '2026-11-30T18:00:00Z',
      status: 'ESTIMATING',
    },
  ];

  const rfqs = [];
  for (const rfqDef of rfqDefinitions) {
    const rfq = await prisma.rFQ.upsert({
      where: { rfqNumber: rfqDef.rfqNumber },
      update: {
        status: rfqDef.status,
        dueDate: new Date(rfqDef.dueDate),
        lostReason: rfqDef.lostReason || null,
      },
      create: {
        rfqNumber: rfqDef.rfqNumber,
        customerName: rfqDef.customerName,
        customerType: rfqDef.customerType,
        receivedAt: new Date(rfqDef.receivedAt),
        dueDate: new Date(rfqDef.dueDate),
        ownerId: estimator.id,
        status: rfqDef.status,
        lostReason: rfqDef.lostReason || null,
      },
    });
    rfqs.push(rfq);
  }
  console.log(`✓ Seeded ${rfqs.length} RFQs (including overdue RFQ-2026-0004)`);

  // 4. Seed 15 Parts across RFQs (including exact reference parts A, B, and C)
  const partDefinitions = [
    // --- EXACT REFERENCE PART A ---
    {
      rfqIndex: 0,
      partNumber: 'SP-001',
      partName: 'Rear wheel spindle',
      material: 'EN8',
      grossWeightKg: '0.6421',
      netWeightKg: '0.6100',
      scrapPercentage: '5.00',
      annualVolume: 180000,
      setupHours: '2.00',
      operations: [
        { name: 'CNC Rough & Finish Turning', machine: 'CNC Lathe', cycleMinutes: '3.20', rate: '850.00', setup: '2.00', rateId: cncRate?.id },
      ],
    },
    // --- EXACT REFERENCE PART B ---
    {
      rfqIndex: 1,
      partNumber: 'LA-402',
      partName: 'Hydraulic lift arm',
      material: '40Cr4',
      grossWeightKg: '5.0000',
      netWeightKg: '4.6000',
      scrapPercentage: '8.00',
      annualVolume: 24000,
      setupHours: '4.00',
      operations: [
        { name: '1600T Die Forging & Trimming', machine: 'Forging Press 1600T', cycleMinutes: '11.50', rate: '1450.00', setup: '4.00', rateId: forgeRate?.id },
      ],
    },
    // --- EXACT REFERENCE PART C ---
    {
      rfqIndex: 2,
      partNumber: 'GB-108',
      partName: 'Gear blank',
      material: '20MnCr5',
      grossWeightKg: '1.5745',
      netWeightKg: '1.4800',
      scrapPercentage: '6.00',
      annualVolume: 60000,
      setupHours: '3.00',
      operations: [
        { name: 'VMC Profile Machining & Chamfering', machine: 'VMC 3-Axis', cycleMinutes: '4.80', rate: '950.00', setup: '3.00', rateId: vmcRate?.id },
      ],
    },
    // Additional realistic parts to reach 15 total parts for rich similarity & history search
    { rfqIndex: 0, partNumber: 'SP-002', partName: 'Front wheel spindle', material: 'EN8', grossWeightKg: '0.7200', netWeightKg: '0.6800', scrapPercentage: '5.50', annualVolume: 150000, setupHours: '2.00' },
    { rfqIndex: 0, partNumber: 'AX-011', partName: 'Rear axle shaft stub', material: 'EN8', grossWeightKg: '1.2500', netWeightKg: '1.1800', scrapPercentage: '5.60', annualVolume: 80000, setupHours: '2.50' },
    { rfqIndex: 1, partNumber: 'LA-403', partName: 'Heavy lift rocker arm', material: '40Cr4', grossWeightKg: '6.2000', netWeightKg: '5.7000', scrapPercentage: '8.00', annualVolume: 18000, setupHours: '4.00' },
    { rfqIndex: 1, partNumber: 'PIN-09', partName: 'Tractor pivot pin', material: '40Cr4', grossWeightKg: '2.1000', netWeightKg: '1.9500', scrapPercentage: '7.10', annualVolume: 45000, setupHours: '3.00' },
    { rfqIndex: 2, partNumber: 'GB-109', partName: 'Splined pinion gear blank', material: '20MnCr5', grossWeightKg: '2.1500', netWeightKg: '2.0000', scrapPercentage: '7.00', annualVolume: 50000, setupHours: '3.50' },
    { rfqIndex: 2, partNumber: 'GB-110', partName: 'Bull gear forging ring', material: '20MnCr5', grossWeightKg: '4.8000', netWeightKg: '4.4500', scrapPercentage: '7.30', annualVolume: 30000, setupHours: '4.00' },
    { rfqIndex: 3, partNumber: 'FL-201', partName: 'Drive flange coupling', material: 'EN8', grossWeightKg: '3.1000', netWeightKg: '2.9000', scrapPercentage: '6.40', annualVolume: 40000, setupHours: '2.50' },
    { rfqIndex: 4, partNumber: 'ST-005', partName: 'Tie rod end forged body', material: '40Cr4', grossWeightKg: '1.8500', netWeightKg: '1.7000', scrapPercentage: '8.10', annualVolume: 70000, setupHours: '3.00' },
    { rfqIndex: 5, partNumber: 'GB-099', partName: 'Cluster gear blank', material: '20MnCr5', grossWeightKg: '3.4000', netWeightKg: '3.1500', scrapPercentage: '7.30', annualVolume: 55000, setupHours: '3.50' },
    { rfqIndex: 6, partNumber: 'SS-301', partName: 'Exhaust manifold nozzle', material: 'SS304', grossWeightKg: '0.9500', netWeightKg: '0.8800', scrapPercentage: '7.40', annualVolume: 25000, setupHours: '3.00' },
    { rfqIndex: 7, partNumber: 'BR-112', partName: 'Forged steering bracket', material: '40Cr4', grossWeightKg: '3.9000', netWeightKg: '3.6000', scrapPercentage: '7.70', annualVolume: 35000, setupHours: '3.50' },
    { rfqIndex: 7, partNumber: 'PIN-15', partName: 'Connecting clevis pin', material: 'EN8', grossWeightKg: '0.8500', netWeightKg: '0.8000', scrapPercentage: '5.90', annualVolume: 90000, setupHours: '2.00' },
  ];

  const seededParts = [];
  for (const [pIdx, pd] of partDefinitions.entries()) {
    const targetRFQ = rfqs[pd.rfqIndex];
    let part = await prisma.part.findFirst({
      where: { rfqId: targetRFQ.id, partName: pd.partName },
    });

    if (!part) {
      part = await prisma.part.create({
        data: {
          rfqId: targetRFQ.id,
          partNumber: pd.partNumber,
          partName: pd.partName,
          material: pd.material,
          grossWeightKg: pd.grossWeightKg,
          netWeightKg: pd.netWeightKg,
          scrapPercentage: pd.scrapPercentage,
          annualVolume: pd.annualVolume,
          setupHours: pd.setupHours,
          routingStatus: pIdx % 2 === 0 ? 'VERIFIED' : 'PENDING_REVIEW',
          routingVerifiedBy: pIdx % 2 === 0 ? 'Vikram Shinde (Plant Head)' : null,
          routingVerifiedAt: pIdx % 2 === 0 ? new Date('2026-10-24T16:00:00Z') : null,
          routingNotes: pIdx % 2 === 0 ? 'Plant feasibility verified: tooling and machine hour rates cleared for Chakan Bay 2.' : null,
        },
      });

      if (pd.operations) {
        for (let idx = 0; idx < pd.operations.length; idx++) {
          const op = pd.operations[idx];
          await prisma.partOperation.create({
            data: {
              partId: part.id,
              operationSequence: idx + 1,
              operationName: op.name,
              machineType: op.machine,
              cycleTimeMinutes: op.cycleMinutes,
              machineHourRate: op.rate,
              machineRateVersionId: op.rateId || null,
              setupHours: op.setup,
            },
          });
        }
      }
    }
    seededParts.push(part);
  }
  console.log(`✓ Seeded ${seededParts.length} parts with operational routings`);

  // 5. Seed Historical Quotations (3 quotes: 1 Approved, 1 Rejected, 2 Pending Approvals)
  // Quotation 1: APPROVED (RFQ-2026-0005)
  const q1 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QT-2026-0001' },
    update: {},
    create: {
      rfqId: rfqs[4].id,
      quotationNumber: 'QT-2026-0001',
      versionNumber: 1,
      status: 'APPROVED',
      subtotalBeforeTax: '22815000.00',
      annualContractValue: '22815000.00',
      marginPercentage: '15.00',
      gstPercentage: '18.00',
      gstAmount: '4106700.00',
      totalIncludingGST: '26921700.00',
      calculationVersion: '1.0',
      createdBy: estimator.id,
      approvedBy: salesHead.id,
      mdSignedBy: 'Suresh Patil (Managing Director)',
      mdSignedAt: new Date('2026-10-26T11:00:00Z'),
      mdSignatureHash: 'MD-DEAL-SEAL-89B72F41A',
      mdDealNotes: 'Strategic Tier-1 180,000 annual run agreement approved and signed by MD.',
      rateSnapshot: {
        materialRate: 85,
        machineRate: 850,
        overheadPct: 4,
        packing: 4,
        freight: 2,
        marginPct: 15,
        gstPct: 18,
      },
      calculationSnapshot: {
        partName: 'Rear wheel spindle',
        materialCost: 54.58,
        conversionCost: 45.33,
        setupCost: 0.01,
        overheadCost: 1.81,
        packingCost: 4.0,
        freightCost: 2.0,
        totalCost: 107.74,
        sellingPriceBeforeGST: 126.75,
        gstAmount: 22.82,
        finalPrice: 149.56,
      },
    },
  });

  await prisma.approval.create({
    data: {
      quotationId: q1.id,
      approverId: salesHead.id,
      status: 'APPROVED',
      comment: 'Approved for annual contract run. 15% margin satisfies Tier-1 agreement.',
      actionAt: new Date('2026-10-25T14:30:00Z'),
    },
  }).catch(() => {});

  // Quotation 2: REJECTED (RFQ-2026-0006)
  const q2 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QT-2026-0002' },
    update: {},
    create: {
      rfqId: rfqs[5].id,
      quotationNumber: 'QT-2026-0002',
      versionNumber: 1,
      status: 'REJECTED',
      subtotalBeforeTax: '24519840.00',
      annualContractValue: '24519840.00',
      marginPercentage: '12.00',
      gstPercentage: '18.00',
      gstAmount: '4413571.20',
      totalIncludingGST: '28933411.20',
      calculationVersion: '1.0',
      createdBy: estimator.id,
      approvedBy: salesHead.id,
      mdSignedBy: 'Suresh Patil (Managing Director)',
      mdSignedAt: new Date('2026-10-26T11:00:00Z'),
      mdSignatureHash: 'MD-DEAL-SEAL-89B72F41A',
      mdDealNotes: 'Strategic Tier-1 180,000 annual run agreement approved and signed by MD.',
    },
  });

  await prisma.approval.create({
    data: {
      quotationId: q2.id,
      approverId: salesHead.id,
      status: 'REJECTED',
      comment: 'Rejected: Commercial margin of 12% is below minimum threshold (15%) for 40Cr4 forging.',
      actionAt: new Date('2026-10-22T16:00:00Z'),
    },
  }).catch(() => {});

  // Quotation 3: PENDING APPROVAL 1 (RFQ-2026-0001, Value > ₹25 Lakh)
  const q3 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QT-2026-0003' },
    update: {},
    create: {
      rfqId: rfqs[0].id,
      quotationNumber: 'QT-2026-0003',
      versionNumber: 1,
      status: 'PENDING_APPROVAL',
      subtotalBeforeTax: '22815000.00',
      annualContractValue: '22815000.00', // ₹2.28 Cr > ₹25 Lakh
      marginPercentage: '15.00',
      gstPercentage: '18.00',
      gstAmount: '4106700.00',
      totalIncludingGST: '26921700.00',
      calculationVersion: '1.0',
      createdBy: estimator.id,
    },
  });

  // Quotation 4: PENDING APPROVAL 2 (RFQ-2026-0002, Value > ₹25 Lakh)
  const q4 = await prisma.quotation.upsert({
    where: { quotationNumber: 'QT-2026-0004' },
    update: {},
    create: {
      rfqId: rfqs[1].id,
      quotationNumber: 'QT-2026-0004',
      versionNumber: 1,
      status: 'PENDING_APPROVAL',
      subtotalBeforeTax: '24519840.00',
      annualContractValue: '24519840.00', // ₹2.45 Cr > ₹25 Lakh
      marginPercentage: '15.00',
      gstPercentage: '18.00',
      gstAmount: '4413571.20',
      totalIncludingGST: '28933411.20',
      calculationVersion: '1.0',
      createdBy: estimator.id,
    },
  });

  console.log(`✓ Seeded historical and pending quotations (${q1.quotationNumber}, ${q2.quotationNumber}, ${q3.quotationNumber}, ${q4.quotationNumber})`);

  // 6. Routing Suggestions (Link target parts to similar historical parts)
  await prisma.routingSuggestion.createMany({
    data: [
      {
        targetPartId: seededParts[3].id, // Front wheel spindle
        sourcePartId: seededParts[0].id, // Rear wheel spindle
        similarityScore: '0.8850',
        suggestionData: {
          matchedMaterial: 'EN8',
          weightDeltaKg: 0.11,
          suggestedOperations: ['CNC Rough & Finish Turning (3.2 min, ₹850/hr)'],
        },
        accepted: false,
      },
      {
        targetPartId: seededParts[5].id, // Heavy lift rocker arm
        sourcePartId: seededParts[1].id, // Hydraulic lift arm
        similarityScore: '0.9120',
        suggestionData: {
          matchedMaterial: '40Cr4',
          weightDeltaKg: 1.6,
          suggestedOperations: ['1600T Die Forging & Trimming (11.5 min, ₹1450/hr)'],
        },
        accepted: false,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✓ Seeded deterministic routing similarity suggestions');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
