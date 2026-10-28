import { describe, it, expect } from 'vitest';
import { validateChallenge } from '../utils/validateChallenge.js';

describe('validateChallenge', () => {
  const validChallengeData = {
    id: 'cts-fintech-01',
    theme: 'FinTech',
    source: 'ai',
    challenge: {
      problem: {
        title: 'Offline Expense Splitter',
        statement: 'Students need to split food tabs without mobile reception.'
      },
      restriction: {
        name: 'Local Storage Only',
        rule: 'No remote server sync allowed.'
      },
      resource: {
        name: 'IndexedDB',
        type: 'browser-api',
        guidance: 'Use IndexedDB for local ACID transactions.',
        docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API'
      },
      deliverable: 'A responsive PWA that calculates net balances.'
    }
  };

  it('validates a complete valid challenge object', () => {
    const result = validateChallenge(validChallengeData);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data.theme).toBe('FinTech');
    expect(result.data.source).toBe('ai');
  });

  it('validates an enveloped API response with success: true', () => {
    const result = validateChallenge({
      success: true,
      data: validChallengeData
    });
    expect(result.isValid).toBe(true);
    expect(result.data.id).toBe('cts-fintech-01');
  });

  it('rejects enveloped response with success: false', () => {
    const result = validateChallenge({
      success: false,
      error: { message: 'Quota exceeded' }
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Quota exceeded');
  });

  it('rejects missing or invalid theme', () => {
    const invalid = { ...validChallengeData, theme: 'InvalidTheme' };
    const result = validateChallenge(invalid);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/Invalid or missing theme/);
  });

  it('rejects missing problem statement', () => {
    const invalid = {
      ...validChallengeData,
      challenge: {
        ...validChallengeData.challenge,
        problem: { title: 'Some title', statement: '' }
      }
    };
    const result = validateChallenge(invalid);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/problem statement/);
  });

  it('rejects missing restriction rule', () => {
    const invalid = {
      ...validChallengeData,
      challenge: {
        ...validChallengeData.challenge,
        restriction: { name: 'Some restriction', rule: '   ' }
      }
    };
    const result = validateChallenge(invalid);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/restriction/);
  });

  it('rejects invalid resource documentation URL', () => {
    const invalid = {
      ...validChallengeData,
      challenge: {
        ...validChallengeData.challenge,
        resource: {
          name: 'Tool',
          type: 'tool',
          guidance: 'Helpful',
          docsUrl: 'not-a-valid-url'
        }
      }
    };
    const result = validateChallenge(invalid);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/documentation URL/);
  });

  it('rejects empty deliverable', () => {
    const invalid = {
      ...validChallengeData,
      challenge: {
        ...validChallengeData.challenge,
        deliverable: '   '
      }
    };
    const result = validateChallenge(invalid);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/expected deliverable/);
  });

  it('defaults invalid source to curated-fallback', () => {
    const withBadSource = {
      ...validChallengeData,
      source: 'unknown-vendor'
    };
    const result = validateChallenge(withBadSource);
    expect(result.isValid).toBe(true);
    expect(result.data.source).toBe('curated-fallback');
  });
});
