// server/src/modules/ai/mock.provider.js
import { AIProvider } from './ai.provider.js';

/**
 * Deterministic Mock AI Provider for automated tests and reliable offline demonstration.
 * Parses keywords from input text to simulate high-fidelity industrial extraction.
 */
export class MockAIProvider extends AIProvider {
  constructor() {
    super();
    this.name = 'MockAI';
    this.model = 'mock-extractor-v1';
  }

  async extractRFQ({ emailText = '', partListText = '' }) {
    const combined = `${emailText} ${partListText}`.toLowerCase();

    // Customer detection
    let customer = 'Bajaj Auto Ltd';
    if (combined.includes('mahindra')) customer = 'Mahindra Tractors';
    if (combined.includes('tata')) customer = 'Tata Motors Tier-1';

    // Due date detection
    let dueDate = '2026-11-20T00:00:00.000Z';
    if (combined.includes('15 nov') || combined.includes('15-nov')) {
      dueDate = '2026-11-15T00:00:00.000Z';
    }

    // Parts detection
    const parts = [];

    // Part A: Spindle
    if (combined.includes('spindle')) {
      parts.push({
        partName: {
          value: 'Rear wheel spindle',
          confidence: 0.99,
          sourceType: 'EMAIL',
          sourceText: 'RFQ for Rear wheel spindle in EN8 material',
          verificationStatus: 'PENDING',
        },
        partNumber: {
          value: 'SP-001',
          confidence: 0.95,
          sourceType: 'PART_LIST',
          sourceText: 'Part No: SP-001',
          verificationStatus: 'PENDING',
        },
        material: {
          value: 'EN8',
          confidence: 0.99,
          sourceType: 'EMAIL',
          sourceText: 'Material: EN8',
          verificationStatus: 'PENDING',
        },
        grossWeightKg: {
          value: null,
          confidence: null,
          sourceType: 'UNKNOWN',
          sourceText: null,
          uncertaintyExplanation: 'Gross weight not provided; derive from net weight and scrap',
          verificationStatus: 'PENDING',
        },
        netWeightKg: {
          value: 0.61,
          confidence: 0.98,
          sourceType: 'PART_LIST',
          sourceText: 'Finished Weight: 0.61 kg',
          verificationStatus: 'PENDING',
        },
        annualVolume: {
          value: 180000,
          confidence: 0.99,
          sourceType: 'EMAIL',
          sourceText: 'Annual volume: 180,000 units',
          verificationStatus: 'PENDING',
        },
      });
    }

    // Part B: Lift arm
    if (combined.includes('lift arm') || combined.includes('hydraulic')) {
      parts.push({
        partName: {
          value: 'Hydraulic lift arm',
          confidence: 0.98,
          sourceType: 'EMAIL',
          sourceText: 'Hydraulic lift arm forging',
          verificationStatus: 'PENDING',
        },
        partNumber: {
          value: 'LA-402',
          confidence: 0.90,
          sourceType: 'PART_LIST',
          sourceText: 'LA-402',
          verificationStatus: 'PENDING',
        },
        material: {
          value: '40Cr4',
          confidence: 0.99,
          sourceType: 'EMAIL',
          sourceText: '40Cr4 forged alloy',
          verificationStatus: 'PENDING',
        },
        grossWeightKg: {
          value: 5.0,
          confidence: 0.95,
          sourceType: 'PART_LIST',
          sourceText: 'Raw weight: 5.0 kg',
          verificationStatus: 'PENDING',
        },
        netWeightKg: {
          value: 4.60,
          confidence: 0.98,
          sourceType: 'PART_LIST',
          sourceText: 'Net weight: 4.60 kg',
          verificationStatus: 'PENDING',
        },
        annualVolume: {
          value: 24000,
          confidence: 0.99,
          sourceType: 'EMAIL',
          sourceText: '24,000 pcs/year',
          verificationStatus: 'PENDING',
        },
      });
    }

    // Fallback part if none matched
    if (parts.length === 0) {
      parts.push({
        partName: {
          value: 'Precision Machined Component',
          confidence: 0.75,
          sourceType: 'EMAIL',
          sourceText: 'Component inquiry',
          verificationStatus: 'PENDING',
        },
        partNumber: {
          value: null,
          confidence: null,
          sourceType: 'UNKNOWN',
          sourceText: null,
          verificationStatus: 'PENDING',
        },
        material: {
          value: 'EN8',
          confidence: 0.85,
          sourceType: 'EMAIL',
          sourceText: 'Standard steel',
          verificationStatus: 'PENDING',
        },
        grossWeightKg: {
          value: null,
          confidence: null,
          sourceType: 'UNKNOWN',
          sourceText: null,
          verificationStatus: 'PENDING',
        },
        netWeightKg: {
          value: 1.0,
          confidence: 0.80,
          sourceType: 'PART_LIST',
          sourceText: '1.0 kg approx',
          verificationStatus: 'PENDING',
        },
        annualVolume: {
          value: 50000,
          confidence: 0.85,
          sourceType: 'EMAIL',
          sourceText: '50,000 annual requirement',
          verificationStatus: 'PENDING',
        },
      });
    }

    return {
      customerName: {
        value: customer,
        confidence: 0.99,
        sourceType: 'EMAIL',
        sourceText: `Inquiry from ${customer}`,
        verificationStatus: 'PENDING',
      },
      dueDate: {
        value: dueDate,
        confidence: 0.95,
        sourceType: 'EMAIL',
        sourceText: 'Submission deadline 15 Nov 2026',
        verificationStatus: 'PENDING',
      },
      parts,
      warnings: parts.some(p => p.grossWeightKg.value === null)
        ? ['Gross weight missing for one or more components; derive from net weight and scrap.']
        : [],
    };
  }
}
