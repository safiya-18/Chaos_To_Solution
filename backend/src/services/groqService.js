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

  return `You are the Official Challenge Architect for the IEEE Computer Society hackathon "Chaos to Solution".
Your task is to generate an ambitious, realistic, cohesive challenge strictly tailored to the theme: "${theme}".

CORE GENERATION PHILOSOPHY:
Build a functional, demonstrable MVP within 3 hours, with optional opportunities for further innovation.
Realistic for a two-member engineering student team using AI coding assistants. Focus on engineering depth (algorithms, prioritization, resource allocation, matching) rather than feature quantity.

STRICT 3-HOUR SCOPE MODEL:
Every generated challenge deliverable MUST be partitioned into three clear tiers:
1. LEVEL 1 — MUST BUILD (Core MVP) [Mandatory]:
   - Solves one primary user problem and journey.
   - 3 to 5 meaningful functional capabilities (working input, processing, output, validation, functional interface).
   - Demonstrable with supplied or permitted resources. Static mockups or non-functional screens are not acceptable.
2. LEVEL 2 — SHOULD IMPROVE (Enhancements) [Optional]:
   - Improvements attempted after Core MVP is working (e.g., advanced filtering, analytics, visualizations, accessibility, data export, error handling).
3. LEVEL 3 — BONUS CHALLENGE (Stretch Goals) [Optional]:
   - Advanced features for teams that finish early (e.g., algorithmic optimization, advanced recommendation, performance tuning). Never mandatory for submission.

PRESERVE ALL MANDATORY RESTRICTIONS:
- If the restriction specifies client-side only / zero backend, all logic and storage must remain purely client-side (no backend APIs or server databases).
- If simulated data is required, do NOT permit live hardware, real credentials, or payment gateways.
- Never require paid APIs, microservices, complex real-time socket infrastructure, or heavy ML model training.

DELIVERABLE SPECIFICATION:
The deliverable MUST describe a complete, working solution structured as follows:
- Product Objective: Clear description of what is built and what friction point it solves.
- Core MVP (Must Build): Mandatory functional capabilities, input/processing/output, demonstrable result.
- Enhancements (Should Improve): Optional enhancements (filtering, analytics, visualizations, export).
- Bonus (Stretch Goals): Optional stretch goals (algorithmic optimization, advanced recommendations).
- Expected Working Outcome: Demonstrable, testable criteria at demo time.
- Evaluation Criteria: Measurable rubrics (functional completeness, correctness, user experience, constraint compliance).

LENGTH BOUNDS: Keep problem statement, restriction rule, and resource guidance under 500 characters. Keep the deliverable comprehensive yet concise (between 350 and 1500 characters).
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
