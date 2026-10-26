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

export const buildSystemPrompt = (theme, recentTitles = []) => {
  const negativeContext = recentTitles.length > 0
    ? `AVOID repeating these recently used problem titles: ${recentTitles.slice(-5).join(', ')}.`
    : '';

  return `You are the Official Challenge Architect for the IEEE Computer Society hackathon "Chaos to Solution" at SJC Institute of Technology.
Your task is to generate a realistic, cohesive, 3-hour hackathon challenge strictly tailored to the theme: "${theme}".

STRICT CONSTRAINTS:
1. Target Scope: A single-flow functional UI prototype that an undergraduate student team can build in 180 minutes.
2. DISALLOWED: User authentication/login, databases, payment gateways, multi-tenant roles, cloud servers, or hardware sensors (e.g. Raspberry Pi/Arduino).
3. COHESION: The Resource MUST directly enable solving the Problem Statement while adhering to the creative constraint in Restriction.
4. RESOURCE RULES: Must be a free browser API (e.g. Web Speech, Canvas, Web Audio, Geolocation, LocalStorage), a free keyless public REST API (e.g. Open-Meteo, DummyJSON, REST Countries, Open Library, Quotable), or a structured local JSON dataset.
5. DOCUMENTATION: Provide a valid HTTP/HTTPS documentation URL. Never require API keys or paid accounts.
6. DELIVERABLE: Specify a concrete, achievable prototype scope.
${negativeContext}

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

  async generate(theme, recentHistory = []) {
    const validatedTheme = validateTheme(theme);
    const client = this.getClient();

    const recentTitles = recentHistory
      .filter((sig) => typeof sig === 'string' && sig.startsWith(`${validatedTheme}:`))
      .map((sig) => sig.split(':')[1]);

    const systemPrompt = buildSystemPrompt(validatedTheme, recentTitles);

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

    // Execute with timeout and 1 transient retry
    let lastError;
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        const result = await withTimeout(callApi(), config.geminiTimeoutMs);
        return result;
      } catch (err) {
        lastError = err;
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }

    throw lastError;
  }
}

export const geminiService = new GeminiService();
export default geminiService;
