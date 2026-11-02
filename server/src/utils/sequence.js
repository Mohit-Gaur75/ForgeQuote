// server/src/utils/sequence.js
import { prisma } from '../config/database.js';

export async function generateRFQNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.rFQ.count({
    where: {
      rfqNumber: { startsWith: `RFQ-${year}-` },
    },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `RFQ-${year}-${seq}`;
}

export async function generateQuotationNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.quotation.count({
    where: {
      quotationNumber: { startsWith: `QT-${year}-` },
    },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `QT-${year}-${seq}`;
}
