import { GoogleGenAI } from '@google/genai';
import config from '../config/env.js';
import { validateTheme } from '../utils/challengeValidator.js';

export const challengeResponseSchema = Object.freeze({
  type: 'object',
  properties: {
    theme: { type: 'string' },
    problem: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        statement: { type: 'string' }
      },
      required: ['title', 'statement']
    },
    restriction: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        rule: { type: 'string' }
      },
      required: ['name', 'rule']
    },
    resource: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['browser-api', 'public-api', 'local-dataset'] },
        guidance: { type: 'string' },
        docsUrl: { type: 'string' }
      },
      required: ['name', 'type', 'guidance', 'docsUrl']
    },
    deliverable: { type: 'string' }
  },
  required: ['theme', 'problem', 'restriction', 'resource', 'deliverable']
});

export const buildSystemPrompt = (theme, recentTitles = [], groundingContext = '') => {
  const negativeContext = recentTitles.length > 0
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
      reject(new Error(`Gemini API request timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

export class GeminiService {
  constructor(client = null) {
    this.client = client;
  }

  getClient() {
    if (!this.client) {
      if (!config.geminiApiKey) {
        throw new Error('GEMINI_API_KEY is not configured in backend environment.');
      }
      this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
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
    const systemPrompt = buildSystemPrompt(validatedTheme, recentTitles, groundingContext);

    const callApi = async () => {
      const response = await client.models.generateContent({
        model: config.geminiModel,
        contents: [
          {
            role: 'user',
            parts: [{ text: `Generate an integrated 3-hour challenge for the theme: ${validatedTheme}` }]
          }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: challengeResponseSchema,
          temperature: 0.7
        }
      });

      const responseText = response.text?.() || response.text || '';
      if (!responseText) {
        throw new Error('Gemini API returned empty response text.');
      }

      return JSON.parse(responseText);
    };

    // Execute with timeout and optional transient retry (never retry on timeout, 429, or 503)
    let lastError;
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        const result = await withTimeout(callApi(), config.geminiTimeoutMs);
        return result;
      } catch (err) {
        lastError = err;
        const msg = String(err.message || '');
        const isNonRetryable =
          msg.includes('timed out') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('503') ||
          msg.includes('UNAVAILABLE');

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

export const geminiService = new GeminiService();
export default geminiService;
