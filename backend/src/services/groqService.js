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
export const buildGroqSystemPrompt = (theme, recentTitles = [], groundingContext = '', diversityContext = '') => {
  const negativeContext =
    recentTitles.length > 0
      ? `AVOID repeating these recently used problem titles: ${recentTitles.slice(-5).join(', ')}.`
      : '';

  const groundingSection = groundingContext ? `\n\nGROUNDED KNOWLEDGE & APPROVED RESOURCES:\n${groundingContext}` : '';
  const diversitySection = diversityContext ? `\n\nCHALLENGE DIVERSITY & ARCHETYPE ROTATION:\n${diversityContext}` : '';

  return `You are the Official Challenge Architect for the IEEE Computer Society hackathon "Chaos to Solution".
Your task is to generate an ambitious, realistic, cohesive challenge strictly tailored to the theme: "${theme}".

CORE GENERATION PHILOSOPHY:
"Build a functional, demonstrable MVP within 3 hours, with optional opportunities for further innovation."
- The challenge must be technically meaningful and engaging for engineering students.
- Realistic for a two-member team using AI coding assistants.
- Achievable and testable during the final demonstration.
- Focused on solving one clearly defined core problem. Do not generate enterprise-scale product requirements.
- Strictly compliant with official technical restrictions. Do not confuse feature quantity with challenge quality.

STRICT 3-HOUR SCOPE MODEL:
Every generated challenge deliverable MUST be explicitly structured into three distinct tiers:
1. LEVEL 1 — MUST BUILD (Core MVP) [Mandatory]:
   - Minimum functional solution that every team must complete within 3 hours.
   - One clearly defined primary user problem and user journey.
   - Approximately 3–5 meaningful functional capabilities (working input, processing, output, validation, functional interface).
   - Demonstrable result using supplied or permitted data.
   - Only essential architecture and integrations.
   - The core MVP must be independently usable and demonstrable. Static mockups or non-functional screens do NOT count as completion.
2. LEVEL 2 — SHOULD IMPROVE (Enhancements) [Optional]:
   - Improvements teams can attempt after completing the core MVP (e.g., advanced filtering, additional analytics, better visualizations, improved accessibility, data export, error handling).
3. LEVEL 3 — BONUS CHALLENGE (Stretch Goals) [Optional]:
   - Advanced features for teams finishing early (e.g., algorithmic optimization, advanced recommendations, performance improvements, additional user role). Never make stretch goals mandatory.

AVOID UNREALISTIC REQUIREMENTS:
Do NOT demand:
- Full production authentication / authorization / RBAC.
- Complex multi-role administration platforms.
- Multiple independent backend services or microservices.
- Complex real-time infrastructure or WebSocket clusters.
- Large-scale machine learning model training.
- External integrations requiring lengthy setup or credentials.
- Multiple unrelated user workflows or large datasets requiring extensive preprocessing.
- Enterprise security infrastructure or deployment pipelines.
Instead, favor existing browser APIs, local storage (LocalStorage/IndexedDB), supplied datasets, and keyless public APIs.

KEEP CHALLENGES INTERESTING:
The difficulty must come from meaningful engineering decisions and algorithmic depth, not administrative feature bloat. Examples:
- Designing an efficient graph settlement or minimization algorithm.
- Developing a transparent rule-based prioritization algorithm.
- Detecting meaningful anomaly patterns in supplied data streams.
- Optimizing resource allocation or bipartite matching.
- Creating an accessible, responsive user workflow.

PRESERVE ALL MANDATORY RESTRICTIONS:
- If the restriction specifies client-side only / zero backend, all logic and storage must remain purely client-side.
- If simulated data is required, do NOT permit live hardware, real credentials, or payment gateways.
- Never require paid APIs or paid services.

DELIVERABLE SPECIFICATION:
The deliverable MUST be concise, well-structured, and explicitly contain:
- Product Objective: Clear description of what is built and what friction point it solves.
- LEVEL 1 — MUST BUILD (Core MVP): 3–5 mandatory capabilities (input, processing, output, validation, functional interface, demonstrable result).
- LEVEL 2 — SHOULD IMPROVE (Enhancements): Optional capabilities (filtering, analytics, visualizations, export).
- LEVEL 3 — BONUS CHALLENGE (Stretch Goals): Optional advanced improvements (algorithmic optimization, advanced recommendations).
- Expected Working Outcome: Demonstrable, testable criteria at demo time.
- Evaluation Criteria: Measurable rubrics (functional completeness, correctness, user experience, constraint compliance).

LENGTH BOUNDS:
Keep problem statement, restriction rule, and resource guidance under 500 characters. Keep the deliverable comprehensive yet concise (between 300 and 1500 characters).

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
    const diversityContext = options?.diversityContext || '';
    const systemPrompt = buildGroqSystemPrompt(validatedTheme, recentTitles, groundingContext, diversityContext);

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
