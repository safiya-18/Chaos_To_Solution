import { describe, it, expect } from 'vitest';
import TeamAssignment, { normalizeTeamName } from '../../src/models/TeamAssignment.js';

describe('TeamAssignment Model & Schema Validation (Regression Guards)', () => {
  it('normalizes team names accurately', () => {
    expect(normalizeTeamName('  Binary Beasts  ')).toBe('binary beasts');
    expect(normalizeTeamName('Team Alpha')).toBe('team alpha');
    expect(normalizeTeamName('')).toBe('');
    expect(normalizeTeamName(null)).toBe('');
  });

  it('executes pre-validate hook without next is not a function error', async () => {
    // Regression test for Mongoose 8.x/9.x middleware bug:
    // Calling validate() on a new TeamAssignment must not invoke next as a function.
    const doc = new TeamAssignment({
      teamName: 'Cyber Knights',
      theme: 'FinTech',
      challenge: {
        problem: {
          title: 'Split Fare Calculator',
          statement: 'Calculate and settle shared cab fares among college students.'
        },
        restriction: {
          name: 'Zero External Libraries',
          rule: 'Vanilla JS DOM only.'
        },
        resource: {
          name: 'LocalStorage API',
          type: 'browser-api',
          guidance: 'Store student ledger in local storage.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'
        },
        deliverable: 'A working single-page calculator prototype.'
      },
      challengeSource: 'ai',
      challengeId: 'cts-fintech-test1'
    });

    // Both synchronous and async validation calls must succeed without throwing TypeError: next is not a function
    const validationError = doc.validateSync();
    expect(validationError).toBeUndefined();
    await expect(doc.validate()).resolves.toBeUndefined();
    expect(doc.normalizedTeamName).toBe('cyber knights');
  });

  it('rejects team names with fewer than 2 characters', () => {
    const doc = new TeamAssignment({
      teamName: 'A',
      theme: 'EdTech',
      challenge: {
        problem: { title: 'Test', statement: 'Statement of problem here' },
        restriction: { name: 'Rest', rule: 'Rule here' },
        resource: { name: 'Res', type: 'browser-api', guidance: 'Guide', docsUrl: 'https://example.com' },
        deliverable: 'Deliverable here'
      },
      challengeSource: 'curated-fallback',
      challengeId: 'cts-edtech-test2'
    });

    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.teamName).toBeDefined();
    expect(error.errors.teamName.message).toContain('at least 2 characters');
  });

  it('rejects unapproved themes', () => {
    const doc = new TeamAssignment({
      teamName: 'Code Warriors',
      theme: 'CryptoGaming', // Invalid theme
      challenge: {
        problem: { title: 'Test', statement: 'Statement of problem here' },
        restriction: { name: 'Rest', rule: 'Rule here' },
        resource: { name: 'Res', type: 'browser-api', guidance: 'Guide', docsUrl: 'https://example.com' },
        deliverable: 'Deliverable here'
      },
      challengeSource: 'ai',
      challengeId: 'cts-invalid-theme'
    });

    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.theme).toBeDefined();
    expect(error.errors.theme.message).toContain('not an approved hackathon theme');
  });
});
