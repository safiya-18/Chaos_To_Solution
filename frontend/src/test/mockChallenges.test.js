import { describe, it, expect } from 'vitest';
import { THEMES, MOCK_CHALLENGES } from '../data/mockChallenges.js';
import { validateChallenge } from '../utils/validateChallenge.js';

describe('mockChallenges dataset', () => {
  const EXPECTED_THEMES = [
    'EdTech',
    'FinTech',
    'HealthTech',
    'Sustainability',
    'Smart Cities',
    'Accessibility',
    'E-commerce',
    'Open Innovation'
  ];

  it('contains exactly the 8 required hackathon themes', () => {
    const themeNames = THEMES.map((t) => t.name);
    expect(themeNames).toEqual(EXPECTED_THEMES);
    expect(THEMES).toHaveLength(8);
  });

  it('provides valid fixtures for every theme conforming to the challenge contract', () => {
    let aiSourceCount = 0;
    let fallbackSourceCount = 0;

    for (const theme of EXPECTED_THEMES) {
      const fixtures = MOCK_CHALLENGES[theme];
      expect(fixtures, `Theme ${theme} should have fixtures`).toBeDefined();
      expect(fixtures.length).toBeGreaterThan(0);

      for (const fixture of fixtures) {
        const validation = validateChallenge(fixture);
        expect(validation.isValid, `Fixture ${fixture.id} should be valid`).toBe(true);
        expect(validation.data.theme).toBe(theme);
        expect(validation.data.challenge.problem.title).toBeTruthy();
        expect(validation.data.challenge.problem.statement).toBeTruthy();
        expect(validation.data.challenge.restriction.name).toBeTruthy();
        expect(validation.data.challenge.restriction.rule).toBeTruthy();
        expect(validation.data.challenge.resource.name).toBeTruthy();
        expect(validation.data.challenge.resource.docsUrl).toMatch(/^https?:\/\//);
        expect(validation.data.challenge.deliverable).toBeTruthy();

        if (fixture.source === 'ai') aiSourceCount++;
        if (fixture.source === 'curated-fallback') fallbackSourceCount++;
      }
    }

    expect(aiSourceCount).toBeGreaterThan(0);
    expect(fallbackSourceCount).toBeGreaterThan(0);
  });
});
