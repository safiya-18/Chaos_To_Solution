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

SCOPE & PHILOSOPHY:
1. Target Scope: A complete, functional, multi-component software solution suitable for approximately 2 hours of AI-assisted development (3-hour hackathon duration) by a team of two students.
2. DO NOT DEFAULT to a "single-page application", "basic prototype", "simple dashboard", or "minimal UI" unless explicitly dictated by an official constraint. Challenge participants to build meaningful, demonstrable software with 3-5 functional features.
3. PRESERVE ALL MANDATORY RESTRICTIONS:
   - If the restriction specifies client-side only / zero backend, all logic and storage must remain purely client-side.
   - If simulated data is required, do NOT permit live hardware, real credentials, or payment gateways.
   - Zero external cloud services: Use free browser APIs, supplied datasets, or keyless public APIs. When phrasing restrictions, state constraints simply (e.g. 'Pure client-side only using LocalStorage', 'Use only free keyless tools or supplied datasets', 'Zero external cloud services') — do NOT use the literal phrase 'paid API'.
4. COHESION: The Resource MUST directly enable solving the Problem Statement while adhering to the creative constraint in Restriction.
5. RESOURCE RULES: Must be a free browser API (e.g. Web Speech, Canvas, Web Audio, Geolocation, LocalStorage, IndexedDB), a free keyless public REST API (e.g. Open-Meteo, DummyJSON, REST Countries, Open Library, Quotable), or a structured local JSON dataset.
6. DELIVERABLE SPECIFICATION: The deliverable MUST be natural prose (between 150 and 600 characters, NEVER structured JSON). Clearly describe what participants build, 3-5 functional requirements, and the expected working demonstration outcome.
7. LENGTH BOUNDS: Keep problem statement, restriction rule, and resource guidance under 400 characters. Keep the deliverable concise and easy to understand (between 150 and 600 characters).
${negativeContext}${groundingSection}

Return ONLY a valid JSON object matching the requested schema.`;
};

export const formatDeliverableProse = (raw) => {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const innerObj = JSON.parse(trimmed);
      if (typeof innerObj === 'object' && innerObj !== null) {
        return Object.entries(innerObj)
          .map(([k, v]) => {
            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
            return `${label}: ${Array.isArray(v) ? v.join('; ') : v}`;
          })
          .join('\n\n');
      }
    } catch {
      const matches = [...trimmed.matchAll(/"([^"]+)"\s*:\s*("(?:[^"\\]|\\.)*"|\[[^\]]*\]|[^,}\n]+)/g)];
      if (matches.length > 0) {
        return matches
          .map(([, k, v]) => {
            let val = v.trim();
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1).replace(/\\"/g, '"');
            }
            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
            return `${label}: ${val}`;
          })
          .join('\n\n');
      }
    }
  }
  return raw;
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
        max_tokens: 1536,
        temperature: 0.7
      });

      const responseText = completion.choices?.[0]?.message?.content || '';
      if (!responseText) {
        throw new Error('Groq API returned empty response content.');
      }

      const parsed = JSON.parse(responseText);
      if (typeof parsed?.deliverable === 'string') {
        parsed.deliverable = formatDeliverableProse(parsed.deliverable);
      }
      if (typeof parsed?.deliverable === 'string' && parsed.deliverable.length > 1500) {
        parsed.deliverable = parsed.deliverable.slice(0, 1495) + '...';
      }
      if (typeof parsed?.problem?.statement === 'string' && parsed.problem.statement.length > 500) {
        parsed.problem.statement = parsed.problem.statement.slice(0, 495) + '...';
      }
      if (typeof parsed?.restriction?.rule === 'string' && parsed.restriction.rule.length > 500) {
        parsed.restriction.rule = parsed.restriction.rule.slice(0, 495) + '...';
      }
      if (typeof parsed?.resource?.guidance === 'string' && parsed.resource.guidance.length > 500) {
        parsed.resource.guidance = parsed.resource.guidance.slice(0, 495) + '...';
      }

      return parsed;
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
