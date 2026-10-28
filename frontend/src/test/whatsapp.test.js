import { describe, it, expect } from 'vitest';
import {
  validateIndianPhoneNumber,
  formatChallengeForWhatsApp,
  buildWhatsAppShareUrl
} from '../utils/whatsapp.js';

describe('whatsapp utils', () => {
  describe('validateIndianPhoneNumber', () => {
    it('validates a standard 10-digit Indian phone number', () => {
      const result = validateIndianPhoneNumber('9876543210');
      expect(result.isValid).toBe(true);
      expect(result.normalizedNumber).toBe('919876543210');
      expect(result.error).toBeNull();
    });

    it('normalizes a number with leading +91 and spaces', () => {
      const result = validateIndianPhoneNumber('+91 98765 43210');
      expect(result.isValid).toBe(true);
      expect(result.normalizedNumber).toBe('919876543210');
    });

    it('normalizes a number with leading 91 without plus', () => {
      const result = validateIndianPhoneNumber('919876543210');
      expect(result.isValid).toBe(true);
      expect(result.normalizedNumber).toBe('919876543210');
    });

    it('normalizes a number with leading 0 (STD trunk prefix)', () => {
      const result = validateIndianPhoneNumber('09876543210');
      expect(result.isValid).toBe(true);
      expect(result.normalizedNumber).toBe('919876543210');
    });

    it('handles hyphens and parentheses', () => {
      const result = validateIndianPhoneNumber('+91 (98765) 43-210');
      expect(result.isValid).toBe(true);
      expect(result.normalizedNumber).toBe('919876543210');
    });

    it('rejects empty or whitespace-only inputs', () => {
      expect(validateIndianPhoneNumber('').isValid).toBe(false);
      expect(validateIndianPhoneNumber('   ').isValid).toBe(false);
    });

    it('rejects numbers that do not start with 6, 7, 8, or 9', () => {
      const result = validateIndianPhoneNumber('5876543210');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/must start with 6, 7, 8, or 9/);
    });

    it('rejects numbers with incorrect lengths', () => {
      expect(validateIndianPhoneNumber('98765').isValid).toBe(false);
      expect(validateIndianPhoneNumber('9876543210123').isValid).toBe(false);
    });

    it('rejects numbers containing alphabetical characters', () => {
      expect(validateIndianPhoneNumber('987654321a').isValid).toBe(false);
    });
  });

  describe('formatChallengeForWhatsApp and buildWhatsAppShareUrl', () => {
    const mockChallenge = {
      id: 'cts-test-01',
      theme: 'EdTech',
      source: 'ai',
      challenge: {
        problem: {
          title: 'Lab Audio Flashcards',
          statement: 'Help students revise terminology.'
        },
        restriction: {
          name: 'Hands-Free',
          rule: 'Voice only.'
        },
        resource: {
          name: 'Web Speech API',
          type: 'browser-api',
          guidance: 'Speech synthesis and recognition.',
          docsUrl: 'https://developer.mozilla.org/'
        },
        deliverable: 'Voice interactive quiz.'
      }
    };

    it('formats a complete WhatsApp message with IEEE branding and all 4 sections', () => {
      const text = formatChallengeForWhatsApp(mockChallenge);
      expect(text).toContain('CHAOS TO SOLUTION');
      expect(text).toContain('IEEE Computer Society');
      expect(text).toContain('EdTech');
      expect(text).toContain('Lab Audio Flashcards');
      expect(text).toContain('Hands-Free');
      expect(text).toContain('Web Speech API');
      expect(text).toContain('Voice interactive quiz');
      expect(text).toContain('AI Generated');
    });

    it('generates a valid https://wa.me/ URL with encoded text', () => {
      const result = buildWhatsAppShareUrl('9876543210', mockChallenge);
      expect(result.error).toBeNull();
      expect(result.url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
      expect(result.url).toContain(encodeURIComponent('CHAOS TO SOLUTION'));
    });

    it('returns error when given invalid phone number', () => {
      const result = buildWhatsAppShareUrl('1234', mockChallenge);
      expect(result.url).toBeNull();
      expect(result.error).toBeDefined();
    });
  });
});
