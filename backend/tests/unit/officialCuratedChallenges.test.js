import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_PATH = path.resolve(__dirname, '../../src/data/officialCuratedChallenges.json');

describe('Official Curated Challenges Dataset Audit (40 Problem Statements)', () => {
  it('should exist and parse as a valid JSON array of exactly 40 challenges', () => {
    expect(fs.existsSync(DATASET_PATH)).toBe(true);
    const raw = fs.readFileSync(DATASET_PATH, 'utf-8');
    const data = JSON.parse(raw);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(40);
  });

  it('should contain exactly 10 challenges for each of the four target themes', () => {
    const data = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8'));
    const expectedThemes = ['FinTech', 'Sustainability', 'EdTech', 'Open Innovation'];
    const themeCounts = {};

    for (const item of data) {
      themeCounts[item.theme] = (themeCounts[item.theme] || 0) + 1;
    }

    for (const theme of expectedThemes) {
      expect(themeCounts[theme]).toBe(10);
    }
  });

  it('should enforce strict schema compliance and unique IDs across all 40 records', () => {
    const data = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8'));
    const ids = new Set();
    const validDifficulties = ['easy', 'medium', 'hard'];

    data.forEach((item, index) => {
      // Unique ID check
      expect(item.id).toBeDefined();
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThanOrEqual(3);
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);

      // Number in theme 1-10
      expect(typeof item.number).toBe('number');
      expect(item.number).toBeGreaterThanOrEqual(1);
      expect(item.number).toBeLessThanOrEqual(10);

      // Title
      expect(typeof item.title).toBe('string');
      expect(item.title.trim().length).toBeGreaterThanOrEqual(5);

      // Problem statement
      expect(typeof item.problemStatement).toBe('string');
      expect(item.problemStatement.trim().length).toBeGreaterThanOrEqual(20);

      // Restrictions array
      expect(Array.isArray(item.restrictions)).toBe(true);
      expect(item.restrictions.length).toBeGreaterThanOrEqual(1);
      item.restrictions.forEach((r) => {
        expect(typeof r).toBe('string');
        expect(r.trim().length).toBeGreaterThanOrEqual(10);
      });

      // Resources provided array
      expect(Array.isArray(item.resourcesProvided)).toBe(true);
      expect(item.resourcesProvided.length).toBeGreaterThanOrEqual(1);
      item.resourcesProvided.forEach((res) => {
        expect(typeof res).toBe('string');
        expect(res.trim().length).toBeGreaterThanOrEqual(10);
      });

      // Tags array
      expect(Array.isArray(item.tags)).toBe(true);
      expect(item.tags.length).toBeGreaterThanOrEqual(2);

      // Justified difficulty
      expect(validDifficulties).toContain(item.difficulty);

      // Source traceability
      expect(item.source).toBeDefined();
      expect(typeof item.source.document).toBe('string');
      expect(item.source.document).toMatch(/\.pdf$/);
      expect(typeof item.source.page).toBe('number');
      expect([1, 2]).toContain(item.source.page);
    });
  });

  it('should match the exact PDF source provenance for each theme', () => {
    const data = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8'));

    const fintech = data.filter((d) => d.theme === 'FinTech');
    fintech.forEach((f) => {
      expect(f.source.document).toBe('Chaos to Solution - FinTech & Sustainability.pdf');
      expect(f.source.page).toBe(1);
    });

    const sustainability = data.filter((d) => d.theme === 'Sustainability');
    sustainability.forEach((s) => {
      expect(s.source.document).toBe('Chaos to Solution - FinTech & Sustainability.pdf');
      expect(s.source.page).toBe(2);
    });

    const edtech = data.filter((d) => d.theme === 'EdTech');
    edtech.forEach((e) => {
      expect(e.source.document).toBe('Chaos to Solution - EdTech & Open Innovation Challenges.pdf');
      expect(e.source.page).toBe(1);
    });

    const openInnovation = data.filter((d) => d.theme === 'Open Innovation');
    openInnovation.forEach((o) => {
      expect(o.source.document).toBe('Chaos to Solution - EdTech & Open Innovation Challenges.pdf');
      expect(o.source.page).toBe(2);
    });
  });
});
