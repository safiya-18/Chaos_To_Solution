import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import problems from '../../src/data/problems.json' with { type: 'json' };
import restrictions from '../../src/data/restrictions.json' with { type: 'json' };
import resources from '../../src/data/resources.json' with { type: 'json' };

import {
  validateDatasets,
  validateProblem,
  calculateValidCombinations,
  ALLOWED_CATEGORIES
} from '../../src/utils/dataValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDir = path.resolve(__dirname, '../../src/data/mock');

describe('Challenge Bank Data Validation (Phase 2)', () => {
  it('should pass deterministic schema validation with zero errors', () => {
    const result = validateDatasets({ problems, restrictions, resources });
    expect(result.errors).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it('should contain at least 20 problems with exactly 4 per approved category', () => {
    expect(problems.length).toBeGreaterThanOrEqual(20);
    ALLOWED_CATEGORIES.forEach((category) => {
      const categoryProblems = problems.filter((p) => p.category === category);
      expect(categoryProblems.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('should contain at least 15 restrictions with valid difficulty weights', () => {
    expect(restrictions.length).toBeGreaterThanOrEqual(15);
    restrictions.forEach((r) => {
      expect([1, 2, 3]).toContain(r.difficultyWeight);
      expect(typeof r.requiresNetwork).toBe('boolean');
    });
  });

  it('should contain at least 15 resources and every public API has a verified local mock file', () => {
    expect(resources.length).toBeGreaterThanOrEqual(15);

    resources.forEach((res) => {
      expect([1, 2, 3]).toContain(res.difficultyWeight);
      if (res.type === 'public-api') {
        expect(res.fallbackMockUrl).toMatch(/^\/api\/mock\//);
        const mockName = res.fallbackMockUrl.replace('/api/mock/', '');
        const mockPath = path.join(mockDir, `${mockName}.json`);
        expect(fs.existsSync(mockPath)).toBe(true);
      } else {
        expect(res.offlineSupported).toBe(true);
        expect(res.fallbackMockUrl).toBeNull();
      }
    });
  });

  it('should verify referential integrity of incompatibility tags', () => {
    const restrictionIds = new Set(restrictions.map((r) => r.id));
    const resourceIds = new Set(resources.map((r) => r.id));

    problems.forEach((p) => {
      p.incompatibleRestrictions?.forEach((rId) => {
        expect(restrictionIds.has(rId)).toBe(true);
      });
      p.incompatibleResources?.forEach((resId) => {
        expect(resourceIds.has(resId)).toBe(true);
      });
    });

    restrictions.forEach((r) => {
      r.incompatibleResources?.forEach((resId) => {
        expect(resourceIds.has(resId)).toBe(true);
      });
    });
  });

  it('should yield more than 1,000 valid combinations within composite difficulty range 4–6', () => {
    const result = calculateValidCombinations(problems, restrictions, resources, {
      minDifficulty: 4,
      maxDifficulty: 6
    });

    expect(result.totalTheoretical).toBe(problems.length * restrictions.length * resources.length);
    expect(result.validCount).toBeGreaterThan(1000);
    expect(result.validCombinations.length).toBe(result.validCount);

    result.validCombinations.forEach((comb) => {
      expect(comb.compositeScore).toBeGreaterThanOrEqual(4);
      expect(comb.compositeScore).toBeLessThanOrEqual(6);
    });
  });

  it('should flag errors when invalid data is provided (negative test)', () => {
    const invalidProblem = {
      id: 'prob_invalid',
      title: 'Bad Problem',
      description: 'Missing stuff',
      category: 'non-existent-category',
      difficulty: 'easy',
      difficultyWeight: 3 // Mismatched weight!
    };

    const errors = validateProblem(invalidProblem);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('invalid category'))).toBe(true);
    expect(errors.some((e) => e.includes('does not match difficulty'))).toBe(true);
  });
});
