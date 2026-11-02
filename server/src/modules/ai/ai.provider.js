// server/src/modules/ai/ai.provider.js

/**
 * Abstract AIProvider interface.
 * Isolates business logic from specific LLM vendors.
 */
export class AIProvider {
  /**
   * @param {{ emailText: string, partListText: string }} input
   * @returns {Promise<object>} Extracted data adhering to AIExtractionResultSchema
   */
  async extractRFQ(input) {
    throw new Error('Method extractRFQ() must be implemented by concrete provider');
  }
}
