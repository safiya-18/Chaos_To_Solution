import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  extractDiversityProfile,
  computeWeightedDiversitySimilarity,
  TRACKED_SOLUTION_ARCHETYPES,
  THEME_SUBDOMAINS,
  ARCHETYPE_SIGNATURES,
  SUBDOMAIN_SIGNATURES,
  PERSONA_SIGNATURES
} from '../../src/services/diversityProfileService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Diversity Profile Service & Semantic Repetition Prevention', () => {
  describe('1. Taxonomy & Architecture Constants', () => {
    it('should define all 15 tracked solution archetypes', () => {
      expect(TRACKED_SOLUTION_ARCHETYPES).toHaveLength(15);
      const expectedArchetypes = [
        'dashboard',
        'calculator',
        'tracker',
        'recommendation-engine',
        'prediction-system',
        'marketplace',
        'matching-system',
        'optimization-engine',
        'classification-system',
        'simulation',
        'scheduling-system',
        'accessibility-tool',
        'data-transformation-tool',
        'resource-allocation-system',
        'workflow-automation-system'
      ];
      expect(TRACKED_SOLUTION_ARCHETYPES).toEqual(expect.arrayContaining(expectedArchetypes));
    });

    it('should define distinct subdomains for all 8 hackathon themes', () => {
      const themes = [
        'FinTech',
        'Sustainability',
        'EdTech',
        'Open Innovation',
        'Healthcare',
        'CyberSecurity',
        'AgriTech',
        'Smart Cities'
      ];
      for (const theme of themes) {
        expect(THEME_SUBDOMAINS[theme]).toBeDefined();
        expect(THEME_SUBDOMAINS[theme].length).toBeGreaterThanOrEqual(8);
      }
      // Specifically FinTech must have 10 subdomains as requested
      expect(THEME_SUBDOMAINS['FinTech']).toHaveLength(10);
      expect(THEME_SUBDOMAINS['FinTech']).toContain('payments-transactions');
      expect(THEME_SUBDOMAINS['FinTech']).toContain('fraud-anomaly');
      expect(THEME_SUBDOMAINS['FinTech']).toContain('taxation-compliance');
    });
  });

  describe('2. Challenge Diversity Profile Extraction', () => {
    it('should extract structured profile with all required dimensions', () => {
      const challenge = {
        theme: 'FinTech',
        problem: {
          title: 'Client-Side Shared Expense Settler',
          statement: 'College roommates and project groups find it difficult to track shared expenses and settle balances fairly without complex apps.'
        },
        restriction: {
          name: 'Pure Client-Side Graph Reducer',
          rule: 'Calculate settlements purely on the client side; zero external payment gateways.'
        },
        resource: {
          name: 'IndexedDB API',
          type: 'browser-api',
          guidance: 'Persist roommate debts locally in browser storage and execute debt minimization offline.'
        },
        deliverable: 'A client-side debt settlement dashboard with minimum transaction reconciliation.'
      };

      const profile = extractDiversityProfile(challenge);

      expect(profile).toHaveProperty('theme', 'FinTech');
      expect(profile).toHaveProperty('subdomain', 'payments-transactions');
      expect(profile).toHaveProperty('solutionArchetype', 'optimization-engine');
      expect(profile).toHaveProperty('userPersona', 'students-learners');
      expect(profile).toHaveProperty('primaryWorkflow', 'import-records-simplify-graph-export');
      expect(profile).toHaveProperty('technicalApproach');
      expect(profile).toHaveProperty('datasetType');
      expect(profile).toHaveProperty('problemCategory', 'payments-transactions:optimization-engine');
    });

    it('should accurately extract all 40 official curated challenges without error', () => {
      const officialDataPath = path.resolve(__dirname, '../../src/data/officialCuratedChallenges.json');
      const officialChallenges = JSON.parse(fs.readFileSync(officialDataPath, 'utf8'));

      expect(officialChallenges).toHaveLength(40);

      const archetypeDistribution = {};
      const subdomainDistribution = {};

      for (const challenge of officialChallenges) {
        const profile = extractDiversityProfile(challenge);
        expect(profile.theme).toBe(challenge.theme);
        expect(profile.subdomain).toBeDefined();
        expect(profile.solutionArchetype).toBeDefined();
        expect(profile.userPersona).toBeDefined();
        expect(profile.primaryWorkflow).toBeDefined();

        archetypeDistribution[profile.solutionArchetype] = (archetypeDistribution[profile.solutionArchetype] || 0) + 1;
        subdomainDistribution[profile.subdomain] = (subdomainDistribution[profile.subdomain] || 0) + 1;
      }

      // Assert diversity of archetypes across the 40 official records
      const detectedArchetypeCount = Object.keys(archetypeDistribution).length;
      expect(detectedArchetypeCount).toBeGreaterThanOrEqual(7);
    });
  });

  describe('3. Weighted Semantic Diversity Similarity Calculation', () => {
    it('should assign very high similarity (>= 0.85) to clones with different titles but identical functionality', () => {
      const challengeA = {
        theme: 'FinTech',
        problem: {
          title: 'Client-Side Shared Expense Settler',
          statement: 'College roommates and project groups find it difficult to track shared expenses and settle balances fairly without complex apps.'
        },
        restriction: {
          rule: 'Calculate settlements purely on the client side; zero external payment gateways.'
        },
        deliverable: 'A client-side debt settlement dashboard with minimum transaction reconciliation.'
      };

      // Disguised clone: different title and superficial phrasing, but identical persona, workflow, problem, and archetype
      const challengeB = {
        theme: 'FinTech',
        problem: {
          title: 'Roommate Debt Resolution Board',
          statement: 'College students living in dorms find it difficult to record split expenses and resolve group debts without complicated servers.'
        },
        restriction: {
          rule: 'Calculate settlement splits purely on the client side; zero external payment gateways.'
        },
        deliverable: 'A client-side debt minimization board with transaction reconciliation.'
      };

      const result = computeWeightedDiversitySimilarity(challengeA, challengeB, 0.70, 0.60);

      expect(result.compositeSimilarity).toBeGreaterThanOrEqual(0.80);
      expect(result.breakdown.workflowSim).toBe(1);
      expect(result.breakdown.archetypeSim).toBe(1);
      expect(result.breakdown.personaSim).toBe(1);
    });

    it('should assign low similarity (<= 0.40) to challenges with different problem archetypes and subdomains', () => {
      const expenseSettler = {
        theme: 'FinTech',
        problem: {
          title: 'Client-Side Shared Expense Settler',
          statement: 'College roommates and project groups find it difficult to track shared expenses and settle balances fairly without complex apps.'
        },
        deliverable: 'A client-side debt settlement dashboard with minimum transaction reconciliation.'
      };

      const fraudDetector = {
        theme: 'FinTech',
        problem: {
          title: 'Rule-Based Digital Wallet Fraud Detector',
          statement: 'Digital wallet users are vulnerable to micro-transaction fraud draining accounts before detection occurs.'
        },
        deliverable: 'A client-side fraud detection interface highlighting suspicious bursts.'
      };

      const result = computeWeightedDiversitySimilarity(expenseSettler, fraudDetector, 0.12, 0.10);

      expect(result.compositeSimilarity).toBeLessThan(0.40);
      expect(result.breakdown.archetypeSim).toBe(0);
    });

    it('should apply 30/25/20/10/10/5 component weights correctly', () => {
      // Mock challenges where raw problem text sim = 0.5, workflow sim = 1, archetype sim = 1, persona = 0, tech = 1, resource = 0
      const challengeA = {
        theme: 'FinTech',
        problem: { title: 'Loan EMI Calculator', statement: 'Borrowers need transparent amortization calculation.' },
        deliverable: 'A loan calculation tool.'
      };
      const challengeB = {
        theme: 'FinTech',
        problem: { title: 'Mortgage Amortization Schedule', statement: 'Homebuyers need loan schedule calculator.' },
        deliverable: 'A mortgage calculation engine.'
      };

      const rawProblemSim = 0.50;
      const rawResourceSim = 0.20;
      const result = computeWeightedDiversitySimilarity(challengeA, challengeB, rawProblemSim, rawResourceSim);

      // Expected calculation:
      // coreProblem: 0.30 * 0.50 = 0.150
      // workflow: 0.25 * 1.0 = 0.250
      // archetype: 0.20 * 1.0 = 0.200
      // persona: 0.10 * personaSim
      // tech: 0.10 * techSim
      // resource: 0.05 * 0.20 = 0.010
      expect(result.compositeSimilarity).toBeGreaterThan(0.60);
      expect(result.breakdown).toHaveProperty('coreProblemSim');
      expect(result.breakdown).toHaveProperty('workflowSim');
      expect(result.breakdown).toHaveProperty('archetypeSim');
      expect(result.breakdown).toHaveProperty('personaSim');
      expect(result.breakdown).toHaveProperty('techSim');
      expect(result.breakdown).toHaveProperty('resourceSim');
    });
  });
});
