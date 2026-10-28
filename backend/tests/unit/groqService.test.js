import { describe, it, expect, vi } from 'vitest';
import {
  GroqService,
  buildGroqSystemPrompt,
  groqChallengeResponseSchema
} from '../../src/services/groqService.js';
import config from '../../src/config/env.js';

describe('Phase 6: GroqService Unit Tests', () => {
  const sampleChallenge = {
    theme: 'EdTech',
    problem: {
      title: 'Distraction-Free Focus Stream',
      statement: 'Create a live notes stream that hides previous entries during typing.'
    },
    restriction: {
      name: 'Keyboard-Only Navigation',
      rule: 'All user actions must be accessible using Tab and Enter keys only.'
    },
    resource: {
      name: 'HTML5 Web Speech API',
      type: 'browser-api',
      guidance: 'Use browser speech recognition to dictate notes without keyboard interference.',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition'
    },
    deliverable: 'A working single-page prototype demonstrating focus note capture.'
  };

  describe('Prompt Construction & Schema Invariants', () => {
    it('should build a concise system prompt incorporating the theme and rules', () => {
      const prompt = buildGroqSystemPrompt('EdTech');
      expect(prompt).toContain('IEEE Computer Society hackathon');
      expect(prompt).toContain('theme: "EdTech"');
      expect(prompt).toContain('3-hour hackathon challenge');
      expect(prompt).toContain('JSON object');
    });

    it('should inject anti-repeat negative context when recent titles are present', () => {
      const recentTitles = ['Math Puzzle Game', 'Flashcard Deck', 'Grammar Helper'];
      const prompt = buildGroqSystemPrompt('EdTech', recentTitles);
      expect(prompt).toContain('AVOID repeating these recently used problem titles');
      expect(prompt).toContain('Math Puzzle Game');
      expect(prompt).toContain('Flashcard Deck');
      expect(prompt).toContain('Grammar Helper');
    });

    it('should enforce strict mode requirements on the JSON schema', () => {
      expect(groqChallengeResponseSchema.additionalProperties).toBe(false);
      expect(groqChallengeResponseSchema.required).toEqual([
        'theme',
        'problem',
        'restriction',
        'resource',
        'deliverable'
      ]);
      expect(groqChallengeResponseSchema.properties.problem.additionalProperties).toBe(false);
      expect(groqChallengeResponseSchema.properties.restriction.additionalProperties).toBe(false);
      expect(groqChallengeResponseSchema.properties.resource.additionalProperties).toBe(false);
      expect(groqChallengeResponseSchema.properties.resource.properties.type.enum).toEqual([
        'browser-api',
        'public-api',
        'local-dataset'
      ]);
    });
  });

  describe('Client Initialization', () => {
    it('should throw an informative error if GROQ_API_KEY is missing when getting default client', () => {
      const service = new GroqService({ apiKey: '' });
      expect(() => service.getClient()).toThrow(
        'GROQ_API_KEY is not configured in backend environment.'
      );
    });

    it('should use injected client directly without checking environment variables', () => {
      const mockClient = { chat: { completions: { create: vi.fn() } } };
      const service = new GroqService(mockClient);
      expect(service.getClient()).toBe(mockClient);
    });
  });

  describe('Generation & Error Handling', () => {
    it('should successfully generate and parse a structured challenge', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify(sampleChallenge)
                  }
                }
              ]
            })
          }
        }
      };

      const service = new GroqService(mockClient);
      const result = await service.generate('EdTech');

      expect(mockClient.chat.completions.create).toHaveBeenCalledOnce();
      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.response_format.type).toBe('json_schema');
      expect(callArgs.response_format.json_schema.strict).toBe(true);
      expect(result).toEqual(sampleChallenge);
    });

    it('should throw an error when API returns empty content', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: ''
                  }
                }
              ]
            })
          }
        }
      };

      const service = new GroqService(mockClient);
      await expect(service.generate('EdTech')).rejects.toThrow(
        'Groq API returned empty response content.'
      );
    });

    it('should fail fast without retrying on HTTP 429 rate limit errors', async () => {
      const createMock = vi.fn().mockRejectedValue(
        new Error('429 rate_limit_exceeded: Request rate limit reached')
      );
      const mockClient = {
        chat: {
          completions: {
            create: createMock
          }
        }
      };

      const service = new GroqService(mockClient);
      await expect(service.generate('EdTech')).rejects.toThrow(/429/);
      expect(createMock).toHaveBeenCalledTimes(1); // Exactly 1 attempt, zero retry loop
    });

    it('should fail fast without retrying on HTTP 503 UNAVAILABLE errors', async () => {
      const createMock = vi.fn().mockRejectedValue(
        new Error('503 Service UNAVAILABLE: Model is overloaded')
      );
      const mockClient = {
        chat: {
          completions: {
            create: createMock
          }
        }
      };

      const service = new GroqService(mockClient);
      await expect(service.generate('EdTech')).rejects.toThrow(/503/);
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    it('should abort and throw when request exceeds timeout threshold', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockImplementation(
              () => new Promise((resolve) => setTimeout(resolve, 200))
            )
          }
        }
      };

      const service = new GroqService({ client: mockClient, timeoutMs: 50 });
      await expect(service.generate('EdTech')).rejects.toThrow(
        /Groq API request timed out after 50ms/
      );
    });
  });
});
