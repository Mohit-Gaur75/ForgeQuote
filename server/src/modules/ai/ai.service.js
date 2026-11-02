// server/src/modules/ai/ai.service.js
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { hashInput } from '../../utils/crypto.js';
import { NotFoundError, AuthorizationError, ValidationError } from '../../utils/errors.js';
import { OpenAIProvider } from './openai.provider.js';
import { MockAIProvider } from './mock.provider.js';
import { AIExtractionResultSchema } from './ai.schema.js';
import { createPart } from '../parts/parts.service.js';

// Select provider: OpenAI if key configured, otherwise MockAI
function getProvider() {
  if (process.env.NODE_ENV === 'test') {
    return new MockAIProvider();
  }
  if (env.OPENAI_API_KEY && !env.OPENAI_API_KEY.includes('replace-with')) {
    return new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL);
  }
  return new MockAIProvider();
}

export async function extractRFQ(user, rfqId, { emailText = '', partListText = '' }) {
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq) {
    throw new NotFoundError('RFQ');
  }

  if (user.role === 'ESTIMATOR' && rfq.ownerId !== user.id) {
    throw new AuthorizationError('You do not have access to extract data for this RFQ');
  }

  // Deduplication check via SHA-256 hash of input text
  const inputHash = hashInput(`${rfqId}::${emailText.trim()}::${partListText.trim()}`);
  const existingExtraction = await prisma.aIExtraction.findFirst({
    where: {
      rfqId,
      inputHash,
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingExtraction && existingExtraction.extractedData) {
    return {
      extractionId: existingExtraction.id,
      cached: true,
      ...existingExtraction.extractedData,
    };
  }

  const provider = getProvider();
  let extractedRaw;

  try {
    extractedRaw = await provider.extractRFQ({ emailText, partListText });
  } catch (err) {
    // Record failed extraction attempt in DB without losing user's session
    await prisma.aIExtraction.create({
      data: {
        rfqId,
        inputHash,
        provider: provider.name,
        model: provider.model,
        status: 'FAILED',
        errorCode: err.code || 'AI_PROVIDER_ERROR',
      },
    }).catch(() => {});

    throw err;
  }

  // Strict runtime validation using Zod
  const validated = AIExtractionResultSchema.parse(extractedRaw);

  // Separate confidence and source data for structured audit storage
  const confidenceData = {
    customerName: validated.customerName?.confidence,
    dueDate: validated.dueDate?.confidence,
    parts: validated.parts.map(p => ({
      partName: p.partName?.confidence,
      material: p.material?.confidence,
      netWeight: p.netWeightKg?.confidence,
      annualVolume: p.annualVolume?.confidence,
    })),
  };

  const sourceData = {
    customerName: validated.customerName?.sourceText,
    dueDate: validated.dueDate?.sourceText,
    parts: validated.parts.map(p => ({
      partName: p.partName?.sourceText,
      netWeight: p.netWeightKg?.sourceText,
      annualVolume: p.annualVolume?.sourceText,
    })),
  };

  const record = await prisma.aIExtraction.create({
    data: {
      rfqId,
      inputHash,
      provider: provider.name,
      model: provider.model,
      extractedData: validated,
      confidenceData,
      sourceData,
      status: 'COMPLETED',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'AI_EXTRACTION',
      entityType: 'AI_EXTRACTION',
      entityId: record.id,
      newValues: { provider: provider.name, partsExtracted: validated.parts.length },
    },
  }).catch(() => {});

  return {
    extractionId: record.id,
    cached: false,
    ...validated,
  };
}

export async function listExtractions(user, rfqId) {
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq) throw new NotFoundError('RFQ');

  return prisma.aIExtraction.findMany({
    where: { rfqId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function confirmExtraction(user, rfqId, extractionId, confirmedData) {
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq) throw new NotFoundError('RFQ');

  if (user.role === 'ESTIMATOR' && rfq.ownerId !== user.id) {
    throw new AuthorizationError('You cannot confirm extraction on an RFQ you do not own');
  }

  const extraction = await prisma.aIExtraction.findUnique({ where: { id: extractionId } });
  if (!extraction || extraction.rfqId !== rfqId) {
    throw new NotFoundError('AIExtraction');
  }

  // 1. Update customer name and due date if confirmed
  const rfqUpdates = {};
  if (confirmedData.confirmedCustomerName) {
    rfqUpdates.customerName = confirmedData.confirmedCustomerName;
  }
  if (confirmedData.confirmedDueDate) {
    rfqUpdates.dueDate = new Date(confirmedData.confirmedDueDate);
  }

  if (Object.keys(rfqUpdates).length > 0) {
    await prisma.rFQ.update({
      where: { id: rfqId },
      data: rfqUpdates,
    });
  }

  // 2. Commit all verified parts to the database
  const createdParts = [];
  for (const partInput of confirmedData.parts) {
    const part = await createPart(user, rfqId, partInput);
    createdParts.push(part);
  }

  // 3. Mark extraction as VERIFIED
  await prisma.aIExtraction.update({
    where: { id: extractionId },
    data: { status: 'VERIFIED' },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'CONFIRM_AI_EXTRACTION',
      entityType: 'AI_EXTRACTION',
      entityId: extractionId,
      newValues: { partsCreatedCount: createdParts.length },
    },
  }).catch(() => {});

  return {
    success: true,
    createdPartsCount: createdParts.length,
    parts: createdParts,
  };
}
