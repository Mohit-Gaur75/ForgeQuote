// server/src/modules/history/history.service.js
import { prisma } from '../../config/database.js';

/**
 * Search historical manufacturing components and previous quotations
 */
export async function searchHistory(user, queryParams = {}) {
  const {
    q,
    material,
    minWeight,
    maxWeight,
    minVolume,
    maxVolume,
    page = 1,
    limit = 15,
  } = queryParams;

  const take = Math.min(Math.max(parseInt(limit, 10) || 15, 1), 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const where = {};

  // Text search on part name, part number, material, or customer name
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { partName: { contains: term, mode: 'insensitive' } },
      { partNumber: { contains: term, mode: 'insensitive' } },
      { material: { contains: term, mode: 'insensitive' } },
      { rfq: { customerName: { contains: term, mode: 'insensitive' } } },
    ];
  }

  // Material filter
  if (material && material !== 'ALL') {
    where.material = { equals: material, mode: 'insensitive' };
  }

  // Weight filters
  if (minWeight !== undefined && minWeight !== '') {
    where.netWeightKg = { ...where.netWeightKg, gte: parseFloat(minWeight) };
  }
  if (maxWeight !== undefined && maxWeight !== '') {
    where.netWeightKg = { ...where.netWeightKg, lte: parseFloat(maxWeight) };
  }

  // Volume filters
  if (minVolume !== undefined && minVolume !== '') {
    where.annualVolume = { ...where.annualVolume, gte: parseInt(minVolume, 10) };
  }
  if (maxVolume !== undefined && maxVolume !== '') {
    where.annualVolume = { ...where.annualVolume, lte: parseInt(maxVolume, 10) };
  }

  const [total, parts] = await Promise.all([
    prisma.part.count({ where }),
    prisma.part.findMany({
      where,
      skip,
      take,
      include: {
        rfq: {
          select: {
            id: true,
            rfqNumber: true,
            customerName: true,
            receivedAt: true,
            status: true,
          },
        },
        operations: {
          orderBy: { operationSequence: 'asc' },
        },
        quotationParts: {
          take: 1,
          orderBy: { quotation: { createdAt: 'desc' } },
          include: {
            quotation: {
              select: {
                id: true,
                quotationNumber: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const formattedParts = parts.map((part) => {
    const latestQPart = part.quotationParts[0];

    return {
      id: part.id,
      partName: part.partName,
      partNumber: part.partNumber,
      material: part.material,
      netWeightKg: part.netWeightKg ? Number(part.netWeightKg) : null,
      grossWeightKg: part.grossWeightKg ? Number(part.grossWeightKg) : null,
      scrapPercentage: part.scrapPercentage ? Number(part.scrapPercentage) : null,
      annualVolume: part.annualVolume,
      createdAt: part.createdAt,
      rfq: part.rfq,
      operationsCount: part.operations.length,
      operations: part.operations.map((op) => ({
        operationSequence: op.operationSequence,
        operationName: op.operationName,
        machineType: op.machineType,
        cycleTimeMinutes: Number(op.cycleTimeMinutes),
        machineHourRate: Number(op.machineHourRate),
        setupHours: op.setupHours ? Number(op.setupHours) : 0,
      })),
      latestQuotation: latestQPart
        ? {
            quotationNumber: latestQPart.quotation.quotationNumber,
            quotationId: latestQPart.quotation.id,
            status: latestQPart.quotation.status,
            sellingPriceBeforeGST: Number(latestQPart.sellingPriceBeforeGST),
            sellingPriceIncludingGST: Number(latestQPart.sellingPriceIncludingGST),
            quotedAnnualVolume: latestQPart.quotedAnnualVolume,
            date: latestQPart.quotation.createdAt,
          }
        : null,
    };
  });

  return {
    parts: formattedParts,
    pagination: {
      page: Math.floor(skip / take) + 1,
      limit: take,
      total,
      totalPages: Math.ceil(total / take) || 1,
    },
  };
}
