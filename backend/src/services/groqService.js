import Groq from 'groq-sdk';
import config from '../config/env.js';
import { APPROVED_THEMES, validateTheme } from '../utils/challengeValidator.js';

/**
 * Strict JSON schema definition for Groq Structured Outputs.
 * In strict mode (strict: true), every object MUST define additionalProperties: false
 * and mark all declared properties in the required array.
 */
export const groqChallengeResponseSchema = Object.freeze({
  type: 'object',
  properties: {
    theme: {
      type: 'string',
      enum: [...APPROVED_THEMES]
    },
    problem: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        statement: { type: 'string' }
      },
      required: ['title', 'statement'],
      additionalProperties: false
    },
    restriction: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        rule: { type: 'string' }
      },
      required: ['name', 'rule'],
      additionalProperties: false
    },
    resource: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: {
          type: 'string',
          enum: ['browser-api', 'public-api', 'local-dataset']
        },
        guidance: { type: 'string' },
        docsUrl: { type: 'string' }
      },
      required: ['name', 'type', 'guidance', 'docsUrl'],
      additionalProperties: false
    },
    deliverable: { type: 'string' }
  },
  required: ['theme', 'problem', 'restriction', 'resource', 'deliverable'],
  additionalProperties: false
});

/**
 * Constructs the system prompt for Groq challenge generation.
 * Formulated to be concise to conserve token quotas while enforcing strict rules.
 */
export const buildGroqSystemPrompt = (theme, recentTitles = [], groundingContext = '') => {
  const negativeContext =
    recentTitles.length > 0
      ? `AVOID repeating these recently used problem titles: ${recentTitles.slice(-5).join(', ')}.`
      : '';

  const groundingSection = groundingContext ? `\n\nGROUNDED KNOWLEDGE & APPROVED RESOURCES:\n${groundingContext}` : '';

  return `You are the Official Challenge Architect for the IEEE Computer Society hackathon "Chaos to Solution" at SJC Institute of Technology.
Your task is to generate a realistic, cohesive, 3-hour hackathon challenge strictly tailored to the theme: "${theme}".

STRICT CONSTRAINTS:
1. Target Scope: A single-flow functional UI prototype achievable in ~180 minutes.
2. DISALLOWED: User authentication/login, databases, payment gateways, multi-tenant roles, cloud servers, paid services, or hardware sensors (Raspberry Pi/Arduino).
3. COHESION: The Resource MUST directly enable solving the Problem Statement while adhering to the creative constraint in Restriction.
4. RESOURCE RULES: Must be a free browser API (e.g. Web Speech, Canvas, Web Audio, Geolocation, LocalStorage), a free keyless public REST API (e.g. Open-Meteo, DummyJSON, REST Countries, Open Library, Quotable), or a structured local JSON dataset.
5. DOCUMENTATION: Provide a valid HTTP/HTTPS documentation URL. Never require API keys or paid accounts.
6. DELIVERABLE: Specify a concrete, achievable prototype scope. Keep description concise (under 400 characters).
7. LENGTH BOUNDS: Keep problem statement, restriction rule, resource guidance, and deliverable each concise (under 400 characters).
${negativeContext}${groundingSection}

Return ONLY a valid JSON object matching the requested schema.`;
};

const withTimeout = (promise, ms) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Groq API request timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

export class GroqService {
  constructor(clientOrOptions = null) {
    if (clientOrOptions && (clientOrOptions.chat || typeof clientOrOptions.getClient === 'function')) {
      this.client = clientOrOptions;
      this.apiKey = config.groqApiKey;
      this.model = config.groqModel;
      this.timeoutMs = config.aiTimeoutMs;
    } else {
      const options = clientOrOptions || {};
      this.client = options.client || null;
      this.apiKey = options.apiKey !== undefined ? options.apiKey : config.groqApiKey;
      this.model = options.model || config.groqModel;
      this.timeoutMs = options.timeoutMs || config.aiTimeoutMs;
    }
  }

  getClient() {
    if (!this.client) {
      if (!this.apiKey) {
        throw new Error('GROQ_API_KEY is not configured in backend environment.');
      }
      this.client = new Groq({ apiKey: this.apiKey });
    }
    return this.client;
  }

  async generate(theme, recentHistory = [], options = {}) {
    const validatedTheme = validateTheme(theme);
    const client = this.getClient();

    const recentTitles = recentHistory
      .filter((sig) => typeof sig === 'string' && sig.startsWith(`${validatedTheme}:`))
      .map((sig) => sig.split(':')[1]);

    const groundingContext = options?.groundingContext || '';
    const systemPrompt = buildGroqSystemPrompt(validatedTheme, recentTitles, groundingContext);

    const callApi = async () => {
      const completion = await client.chat.completions.create({
        model: this.model || config.groqModel || 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate an integrated 3-hour challenge for the theme: ${validatedTheme}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'challenge_generation',
            strict: true,
            schema: groqChallengeResponseSchema
          }
        },
        temperature: 0.7
      });

      const responseText = completion.choices?.[0]?.message?.content || '';
      if (!responseText) {
        throw new Error('Groq API returned empty response content.');
      }

      return JSON.parse(responseText);
    };

    // Execute with timeout and fail-fast non-retryable error handling
    let lastError;
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        const result = await withTimeout(callApi(), this.timeoutMs || config.aiTimeoutMs);
        return result;
      } catch (err) {
        lastError = err;
        const msg = String(err.message || '');
        const isNonRetryable =
          msg.includes('timed out') ||
          msg.includes('429') ||
          msg.includes('rate_limit_exceeded') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('404') ||
          msg.includes('model_not_found');

        if (attempt === 0 && !isNonRetryable) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        } else {
          break;
        }
      }
    }

    throw lastError;
  }
}

export const groqService = new GroqService();
export default groqService;
