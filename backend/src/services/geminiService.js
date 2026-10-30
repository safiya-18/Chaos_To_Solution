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

CORE REQUIREMENT & 3-HOUR HACKATHON SCOPE:
Generate an interesting, technically challenging problem statement that a team of two engineering students can realistically implement and demonstrate within 3 hours using AI coding assistants.
- Do NOT simply increase the time limit while keeping unnecessarily large requirements.
- Focus on ONE clear, meaningful problem.
- Keep required functionality strictly limited to what can realistically be implemented in 3 hours.
- Require approximately 3–5 meaningful features, depending on the challenge.
- Prefer practical functionality and problem-solving over excessive screens, modules, or integrations.
- The final solution must be functional and demonstrable (not just a UI mockup or static prototype).

AVOID ENTERPRISE BLOAT:
Do NOT demand:
- Enterprise-level systems, full production authentication, authorization, or RBAC.
- Complex multi-role administration platforms.
- Multiple independent backend services or microservices.
- Complex real-time infrastructure or WebSocket clusters.
- Large-scale machine learning model training.
- External integrations requiring lengthy setup, paid APIs, or credentials.
- Lengthy multi-step onboarding or extensive data preprocessing.
Instead, favor existing browser APIs, local storage (LocalStorage/IndexedDB), supplied datasets, and keyless public APIs.

MAINTAIN TECHNICAL DEPTH:
Do NOT make every challenge a basic CRUD application or simple dashboard. Maintain technical depth through useful algorithms, data processing, optimization, and meaningful problem-solving where appropriate. Examples:
- Designing an efficient graph settlement or minimization algorithm.
- Developing a transparent rule-based prioritization or scoring algorithm.
- Detecting meaningful anomaly patterns or trends in supplied data streams.
- Optimizing resource allocation, bin packing, or bipartite matching.
- Creating an accessible, responsive, error-tolerant user workflow.

DELIVERABLE WRITING STYLE:
Keep the deliverable concise, natural, and easy for participants to understand (typically 1–2 focused sentences or paragraphs, between 100 and 500 characters).
It should naturally explain:
1. What the team needs to build.
2. What important functionality it should contain (approximately 3–5 meaningful features).
3. What the expected working solution should demonstrate.

DO NOT INTRODUCE SEPARATE SECTIONS:
- Do NOT include separate sections for "Must Build", "Should Improve", "Bonus Challenges", "Stretch Goals", or multi-level implementation tiers.
- Do NOT turn the deliverable into a lengthy technical specification.
- Write it in a clean, natural flow. For example:
  "Build a campus food waste forecasting application that uses supplied historical mess records to estimate preparation quantities based on expected attendance. It should allow users to select meals, calculate recommended quantities, compare historical waste patterns, and display actionable preparation suggestions."

PRESERVE ALL MANDATORY RESTRICTIONS:
All original problem statements, technical restrictions, and supplied resources must remain intact.
- If the restriction specifies client-side only / zero backend, all logic and storage must remain purely client-side.
- If simulated data is required, do NOT permit live hardware, real credentials, or payment gateways.
- Never require paid APIs or paid services.
- Offline functionality, no personal data collection, and asset-size limits must be strictly respected.
- Choose the simplest technically appropriate architecture that satisfies the original problem.

LENGTH BOUNDS:
Keep problem statement, restriction rule, and resource guidance under 500 characters. Keep the deliverable concise and easy to understand (between 100 and 600 characters).

DIVERSITY & FUNCTIONAL NON-REPETITION:
- Generate a genuinely distinct problem across: subdomain, user persona, core algorithm, engineering task, primary workflow, solution archetype, input/output structures, and technical approach.
- FORBID SUPERFICIAL VARIATIONS:
  * Do NOT simply rename an existing dashboard or visualizer.
  * Do NOT replace a calculator with a visualizer while implementing the same arithmetic.
  * Do NOT swap the user persona (e.g., student to merchant) while preserving the same workflow.
  * Do NOT swap the dataset while preserving the exact same algorithm, calculations, and UI.
  * Do NOT reword an existing challenge title or statement.
- ENCOURAGE ALGORITHMIC & ENGINEERING DIVERSITY:
  * Emphasize different computational approaches: graph optimization, time-series forecasting, constraint satisfaction, simulation, rule engines, classification, bipartite matching, or structured transformation.
  * Vary the data structures: tabular records, event streams, hierarchical trees, or relational graphs.
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
