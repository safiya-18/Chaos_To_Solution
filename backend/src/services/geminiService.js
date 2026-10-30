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

export const buildSystemPrompt = (theme, recentTitles = [], groundingContext = '', diversityContext = '') => {
  const negativeContext = recentTitles.length > 0
    ? `AVOID repeating these recently used problem titles: ${recentTitles.slice(-5).join(', ')}.`
    : '';

  const groundingSection = groundingContext ? `\n\nGROUNDED KNOWLEDGE & APPROVED RESOURCES:\n${groundingContext}` : '';
  const diversitySection = diversityContext ? `\n\nCHALLENGE DIVERSITY & ARCHETYPE ROTATION:\n${diversityContext}` : '';

  return `You are the Official Challenge Architect for the IEEE Computer Society hackathon "Chaos to Solution".
Your task is to generate an ambitious, realistic, cohesive challenge strictly tailored to the theme: "${theme}".

SCOPE & PHILOSOPHY:
1. Target Scope: A complete, functional, multi-component software solution suitable for approximately 2 hours of AI-assisted development.
2. DO NOT DEFAULT to a "single-page application", "basic prototype", "simple dashboard", or "minimal UI" unless explicitly dictated by an official constraint. Challenge participants to build meaningful, demonstrable software.
3. PRESERVE ALL MANDATORY RESTRICTIONS:
   - If the restriction specifies client-side only / zero backend, all logic and storage must remain purely client-side.
   - If simulated data is required, do NOT permit live hardware, real credentials, or payment gateways.
   - Never require paid APIs or paid services.
4. COHESION: The Resource MUST directly enable solving the Problem Statement while adhering to the creative constraint in Restriction.
5. RESOURCE RULES: Must be a free browser API (e.g. Web Speech, Canvas, Web Audio, Geolocation, LocalStorage, IndexedDB), a free keyless public REST API (e.g. Open-Meteo, DummyJSON, REST Countries, Open Library, Quotable), or a structured local JSON dataset.
6. DELIVERABLE SPECIFICATION: The deliverable MUST describe a complete, working solution structured as follows:
   - Product Objective: Clear description of what is built and what friction point it solves.
   - Functional Requirements: Meaningful interactive functionality (e.g., input handling, validation, core algorithmic processing, analytics/reporting, search/filtering, offline support, or export).
   - System Components: Component breakdown (e.g., frontend application, local/database persistence, API services, or client modules as permitted).
   - Expected Working Outcome: Demonstrable, testable criteria at demo time.
   - Evaluation Criteria: Measurable rubrics (functional completeness, correctness, user experience, constraint compliance).
7. LENGTH BOUNDS: Keep problem statement, restriction rule, and resource guidance under 500 characters. Keep the deliverable comprehensive yet concise (between 300 and 1200 characters).
8. DIVERSITY & NON-REPETITION:
   - Generate a genuinely distinct problem across: subdomain, user persona, friction point, primary workflow, solution archetype, and technical approach.
   - Do NOT generate superficial clones of popular patterns (e.g. changing only the title or mock data for another basic personal finance tracker or simple CRUD dashboard).
${negativeContext}${groundingSection}${diversitySection}

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
    const diversityContext = options?.diversityContext || '';
    const systemPrompt = buildSystemPrompt(validatedTheme, recentTitles, groundingContext, diversityContext);

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
