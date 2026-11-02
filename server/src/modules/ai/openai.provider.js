// server/src/modules/ai/openai.provider.js
import OpenAI from 'openai';
import { AIProvider } from './ai.provider.js';
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from './ai.prompts.js';
import { env } from '../../config/env.js';
import { ServiceUnavailableError, ValidationError } from '../../utils/errors.js';

export class OpenAIProvider extends AIProvider {
  constructor(apiKey = env.OPENAI_API_KEY, model = env.OPENAI_MODEL) {
    super();
    this.name = 'OpenAI';
    this.model = model || 'gpt-4o-mini';
    this.apiKey = apiKey;

    if (this.apiKey) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        timeout: 30000, // 30 second hard timeout
      });
    }
  }

  async extractRFQ({ emailText = '', partListText = '' }) {
    if (!this.client || !this.apiKey) {
      throw new ServiceUnavailableError('OpenAI API key is not configured in server environment');
    }

    const userPrompt = buildExtractionUserPrompt({ emailText, partListText });

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Near-zero temperature for deterministic extraction
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new ValidationError('AI provider returned an empty response');
      }

      const parsed = JSON.parse(content);
      return parsed;
    } catch (err) {
      if (err.name === 'APIConnectionTimeoutError') {
        throw new ServiceUnavailableError('AI extraction timed out after 30 seconds');
      }
      if (err.status === 429) {
        throw new ServiceUnavailableError('AI provider rate limit reached. Please retry in a few moments.');
      }
      if (err instanceof SyntaxError) {
        throw new ValidationError('AI provider returned malformed JSON');
      }
      throw err;
    }
  }
}
