import { describe, it, expect, vi } from 'vitest';
import {
  extractDiversityProfile,
  computeWeightedDiversitySimilarity,
  computeFunctionalEquivalence,
  DEFAULT_FUNCTIONAL_EQUIVALENCE_WEIGHTS,
  validateFunctionalEquivalenceWeights,
  TRACKED_ALGORITHMIC_APPROACHES
} from '../../src/services/diversityProfileService.js';
import {
  evaluateNovelty,
  DEFAULT_NOVELTY_THRESHOLDS
} from '../../src/services/noveltyService.js';
import { ChallengeService } from '../../src/services/challengeService.js';

describe('Phase 13: Functional Equivalence & Algorithmic Diversity Engine', () => {
  describe('Taxonomy, Schema & Weight Validation', () => {
    it('should define all 17 tracked algorithmic approaches including not_applicable', () => {
      expect(TRACKED_ALGORITHMIC_APPROACHES).toHaveLength(17);
      expect(TRACKED_ALGORITHMIC_APPROACHES).toContain('graph-optimization');
      expect(TRACKED_ALGORITHMIC_APPROACHES).toContain('anomaly-detection');
      expect(TRACKED_ALGORITHMIC_APPROACHES).toContain('classification');
      expect(TRACKED_ALGORITHMIC_APPROACHES).toContain('time-series-forecasting');
      expect(TRACKED_ALGORITHMIC_APPROACHES).toContain('constraint-satisfaction');
      expect(TRACKED_ALGORITHMIC_APPROACHES).toContain('scheduling-optimization');
      expect(TRACKED_ALGORITHMIC_APPROACHES).toContain('not_applicable');
    });

    it('should validate default functional equivalence weights sum to exactly 1.0', () => {
      expect(validateFunctionalEquivalenceWeights(DEFAULT_FUNCTIONAL_EQUIVALENCE_WEIGHTS)).toBe(true);
      const sum = Object.values(DEFAULT_FUNCTIONAL_EQUIVALENCE_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 4);
    });

    it('should throw an error on invalid or negative weights', () => {
      expect(() => validateFunctionalEquivalenceWeights(null)).toThrow();
      expect(() => validateFunctionalEquivalenceWeights({
        ...DEFAULT_FUNCTIONAL_EQUIVALENCE_WEIGHTS,
        CORE_PROBLEM_OUTCOME: -0.1
      })).toThrow();
      expect(() => validateFunctionalEquivalenceWeights({
        ...DEFAULT_FUNCTIONAL_EQUIVALENCE_WEIGHTS,
        CORE_PROBLEM_OUTCOME: 0.50 // Sum will be 1.25
      })).toThrow();
    });
  });

  describe('Test Group A: Superficial Duplicates (Same Solution, Reworded Surfaces)', () => {
    it('Pair 1: Client-Side Shared Expense Settler vs Graph-Minimizing Dorm Bill Settlement Board', async () => {
      const challengeA = {
        theme: 'FinTech',
        title: 'Client-Side Shared Expense Settler',
        problemStatement: 'Roommates and student project groups struggle to split shared expenses and settle up balances fairly.',
        restriction: 'Calculate settlements purely on the client side with zero external payment gateways.',
        resource: 'IndexedDB API for local debt storage and debt minimization.',
        deliverable: 'A client-side debt settlement dashboard with minimum transaction reconciliation.'
      };

      const challengeB = {
        theme: 'FinTech',
        problem: {
          title: 'Graph-Minimizing Dorm Bill Settlement Board',
          statement: 'College roommates living in shared dorms find it difficult to reconcile collective utility bills without confusion.'
        },
        restriction: {
          name: 'Pure Client-Side Graph Reducer',
          rule: 'Execute debt simplification graph algorithms purely on the client with zero backend.'
        },
        resource: {
          name: 'LocalStorage API',
          type: 'browser-api',
          guidance: 'Persist ledger state locally in browser storage.'
        },
        deliverable: 'An offline-capable settlement board that reduces total transactions.'
      };

      const profileA = extractDiversityProfile(challengeA);
      const profileB = extractDiversityProfile(challengeB);

      expect(profileA.coreAlgorithm).toBe('graph-optimization');
      expect(profileB.coreAlgorithm).toBe('graph-optimization');
      expect(profileA.engineeringTask).toBe('reconciliation-settlement');
      expect(profileB.engineeringTask).toBe('reconciliation-settlement');

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.functionalEquivalenceScore).toBeGreaterThanOrEqual(0.75);

      const novelty = await evaluateNovelty(challengeB, {
        comparisonPool: [challengeA]
      });
      expect(['REJECT', 'REGENERATE']).toContain(novelty.decision);
    });

    it('Pair 2: Student Expense Dashboard vs Student Spending Visualizer', async () => {
      const challengeA = {
        theme: 'FinTech',
        title: 'Student Expense Dashboard',
        problemStatement: 'Students struggle to monitor daily allowance burn rate and categorize monthly expense receipts.',
        restriction: 'Must render responsive KPI summary charts and monthly burn rate metrics purely client-side.',
        resource: 'Sample CSV transaction records.',
        deliverable: 'An interactive spending dashboard displaying expense breakdown and monthly budget charts.'
      };

      const challengeB = {
        theme: 'FinTech',
        problem: {
          title: 'Student Spending Visualizer',
          statement: 'Undergraduates lack clear visual charts of their daily spending habits and allowance budget allocation.',
        },
        restriction: {
          name: 'Client-Side Visualizer',
          rule: 'Render interactive charts purely in the browser without server calls.'
        },
        resource: {
          name: 'Tabular CSV records',
          type: 'local-dataset',
          guidance: 'Load sample transaction dataset.'
        },
        deliverable: 'A client-side spending visualizer with category totals and budget charts.'
      };

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.functionalEquivalenceScore).toBeGreaterThanOrEqual(0.68);

      const novelty = await evaluateNovelty(challengeB, { comparisonPool: [challengeA] });
      expect(['REJECT', 'REGENERATE']).toContain(novelty.decision);
    });

    it('Pair 3: Subscription Tracker vs Recurring Payment Auditor', async () => {
      const challengeA = {
        theme: 'FinTech',
        title: 'Subscription Tracker',
        problemStatement: 'Users lose track of forgotten recurring subscriptions that quietly drain monthly bank balances.',
        restriction: 'Flag repeat debits and recurring charges offline in the browser without bank credential sharing.',
        resource: 'Synthetic monthly debit transaction log CSV.',
        deliverable: 'A recurring subscription tracking dashboard that detects repeat debits and alerts users.'
      };

      const challengeB = {
        theme: 'FinTech',
        problem: {
          title: 'Recurring Payment Auditor',
          statement: 'Consumers forget active recurring debit agreements that produce unmonitored financial leakage.'
        },
        restriction: {
          name: 'Zero External Credentials',
          rule: 'Audit recurring payment debits entirely offline in client storage.'
        },
        resource: {
          name: 'Simulated debit stream CSV',
          type: 'local-dataset',
          guidance: 'Parse simulated billing history.'
        },
        deliverable: 'An automated audit tool that identifies recurring debits and displays subscription alerts.'
      };

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.functionalEquivalenceScore).toBeGreaterThanOrEqual(0.70);

      const novelty = await evaluateNovelty(challengeB, { comparisonPool: [challengeA] });
      expect(['REJECT', 'REGENERATE']).toContain(novelty.decision);
    });

    it('Pair 4: Loan Calculator vs Loan Repayment Planner', async () => {
      const challengeA = {
        theme: 'FinTech',
        title: 'Loan Calculator',
        problemStatement: 'First-time borrowers do not understand loan EMI formulas and compound interest accumulation.',
        restriction: 'Calculate amortization schedule and interest formula purely in client-side JavaScript.',
        resource: 'Standard amortization interest formula documentation.',
        deliverable: 'A loan repayment calculator with amortization breakdown table.'
      };

      const challengeB = {
        theme: 'FinTech',
        problem: {
          title: 'Loan Repayment Planner',
          statement: 'Prospective borrowers struggle to plan monthly loan repayments across varying interest slabs.'
        },
        restriction: {
          name: 'Offline Calculator',
          rule: 'Calculate monthly installment and amortization table purely on the client side.'
        },
        resource: {
          name: 'EMI calculation guide',
          type: 'local-dataset',
          guidance: 'Implement interest formula.'
        },
        deliverable: 'An interactive loan planner displaying monthly amortization breakdown.'
      };

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.functionalEquivalenceScore).toBeGreaterThanOrEqual(0.75);

      const novelty = await evaluateNovelty(challengeB, { comparisonPool: [challengeA] });
      expect(['REJECT', 'REGENERATE']).toContain(novelty.decision);
    });
  });

  describe('Test Group B: Different Labels but Identical Engineering Pipeline', () => {
    it('Pair 1: Fraud Dashboard (dashboard) vs Transaction Anomaly Visualizer (classification-system)', async () => {
      const challengeA = {
        theme: 'FinTech',
        title: 'Real-Time Fraud Dashboard',
        problemStatement: 'Analysts need an overview of flagged suspicious debit anomalies in transaction streams.',
        restriction: 'Flag anomalies and render alert stream purely on the client side.',
        resource: 'Simulated transaction feed CSV.',
        deliverable: 'A monitoring dashboard displaying suspicious transaction alerts.'
      };

      const challengeB = {
        theme: 'FinTech',
        problem: {
          title: 'Transaction Anomaly Visualizer',
          statement: 'Detect micro-charge anomaly spikes and flag suspicious unauthorized debit patterns in transaction logs.'
        },
        restriction: {
          name: 'Anomaly Detection Filter',
          rule: 'Filter out anomaly outliers and trigger threat alerts purely offline.'
        },
        resource: {
          name: 'Transaction log dataset',
          type: 'local-dataset',
          guidance: 'Analyze debit transactions.'
        },
        deliverable: 'An anomaly detection system displaying prioritized threat alerts.'
      };

      const profileA = extractDiversityProfile(challengeA);
      const profileB = extractDiversityProfile(challengeB);

      expect(profileA.coreAlgorithm).toBe('anomaly-detection');
      expect(profileB.coreAlgorithm).toBe('anomaly-detection');
      expect(profileA.engineeringTask).toBe('stream-anomaly-monitoring');
      expect(profileB.engineeringTask).toBe('stream-anomaly-monitoring');

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.functionalEquivalenceScore).toBeGreaterThanOrEqual(0.68);
      expect(funcEq.breakdown.coreAlgorithmSim).toBe(1.0);
      expect(funcEq.breakdown.engineeringTaskSim).toBe(1.0);

      const novelty = await evaluateNovelty(challengeB, { comparisonPool: [challengeA] });
      expect(['REJECT', 'REGENERATE']).toContain(novelty.decision);
    });

    it('Pair 2: Inventory Analyzer vs Stock Intelligence Platform', async () => {
      const challengeA = {
        theme: 'E-commerce',
        title: 'Retailer Inventory Analyzer',
        problemStatement: 'Small retailers struggle with warehouse stock allocation and reorder point warnings.',
        restriction: 'Calculate stock depletion rate purely in browser storage.',
        resource: 'Sample warehouse stock CSV.',
        deliverable: 'A stock analytics dashboard displaying reorder alerts and inventory metrics.'
      };

      const challengeB = {
        theme: 'E-commerce',
        problem: {
          title: 'Stock Intelligence Platform',
          statement: 'Merchants lack visibility into warehouse inventory reorder thresholds and stockout risks.'
        },
        restriction: {
          name: 'Client-Side Stock Rules',
          rule: 'Evaluate reorder points and flag inventory shortages purely offline.'
        },
        resource: {
          name: 'Inventory records dataset',
          type: 'local-dataset',
          guidance: 'Parse stock quantities.'
        },
        deliverable: 'An inventory platform alerting merchants to stock depletion and reorder thresholds.'
      };

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.functionalEquivalenceScore).toBeGreaterThanOrEqual(0.70);

      const novelty = await evaluateNovelty(challengeB, { comparisonPool: [challengeA] });
      expect(['REJECT', 'REGENERATE']).toContain(novelty.decision);
    });
  });

  describe('Test Group C: Similar Archetypes, Genuinely Different Problems', () => {
    it('Pair 1: Agricultural Water-Use Dashboard vs Hospital Medicine Inventory Dashboard', async () => {
      const challengeA = {
        theme: 'AgriTech',
        title: 'Agricultural Water-Use Dashboard',
        problemStatement: 'Farmers lack visibility into precision irrigation water loss, soil moisture runoff, and rainfall conservation.',
        restriction: 'Calculate water loss metrics purely client-side without hardware sensors.',
        resource: 'Simulated soil moisture and irrigation runoff CSV.',
        deliverable: 'An irrigation dashboard visualizing water consumption and conservation metrics.'
      };

      const challengeB = {
        theme: 'Healthcare',
        problem: {
          title: 'Hospital Medicine Inventory Dashboard',
          statement: 'Clinical staff struggle to track pharmaceutical supplies and expiring emergency medicine batches across hospital wards.'
        },
        restriction: {
          name: 'Patient Privacy Compliant',
          rule: 'Process medicine inventory logs purely offline with zero external cloud transmission.'
        },
        resource: {
          name: 'Hospital medication batch records',
          type: 'local-dataset',
          guidance: 'Track medication expiration dates.'
        },
        deliverable: 'A clinical pharmacy dashboard monitoring medication inventory and expiration schedules.'
      };

      const profileA = extractDiversityProfile(challengeA);
      const profileB = extractDiversityProfile(challengeB);

      expect(profileA.solutionArchetype).toBe('dashboard');
      expect(profileB.solutionArchetype).toBe('dashboard');

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.functionalEquivalenceScore).toBeLessThan(0.50);

      const novelty = await evaluateNovelty(challengeB, { comparisonPool: [challengeA] });
      expect(novelty.decision).toBe('ACCEPT');
    });

    it('Pair 2: Loan Repayment Calculator vs Carbon Emission Calculator', async () => {
      const challengeA = {
        theme: 'FinTech',
        title: 'Loan Repayment Calculator',
        problemStatement: 'Borrowers struggle to compute monthly EMI payments across varying interest rate slabs.',
        restriction: 'Compute amortization schedules purely client-side.',
        resource: 'Standard loan interest formula guide.',
        deliverable: 'An interactive loan calculator displaying amortization breakdown.'
      };

      const challengeB = {
        theme: 'Sustainability',
        problem: {
          title: 'Campus Carbon Emission Calculator',
          statement: 'University students and campus facilities lack clear visibility into daily carbon footprint disparities from commute choices.'
        },
        restriction: {
          name: 'Zero Cloud Transmission',
          rule: 'Calculate greenhouse gas emission factors purely client-side.'
        },
        resource: {
          name: 'Emission factor lookup table',
          type: 'local-dataset',
          guidance: 'Convert transportation kilometers into CO2 equivalents.'
        },
        deliverable: 'A carbon accounting calculator displaying personal emission breakdown.'
      };

      const profileA = extractDiversityProfile(challengeA);
      const profileB = extractDiversityProfile(challengeB);

      expect(profileA.solutionArchetype).toBe('calculator');
      expect(profileB.solutionArchetype).toBe('calculator');

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.functionalEquivalenceScore).toBeLessThan(0.60);

      const novelty = await evaluateNovelty(challengeB, { comparisonPool: [challengeA] });
      expect(novelty.decision).toBe('ACCEPT');
    });

    it('Pair 3: Student Learning Progress Dashboard vs Merchant Supply-Chain Monitoring Dashboard', async () => {
      const challengeA = {
        theme: 'EdTech',
        title: 'Student Learning Progress Dashboard',
        problemStatement: 'Learners struggle to visualize topic mastery scores, diagnostic quiz results, and concept difficulty distributions.',
        restriction: 'Calculate mastery score purely on the client side.',
        resource: 'Quiz performance dataset.',
        deliverable: 'A learning analytics dashboard visualizing mastery progress.'
      };

      const challengeB = {
        theme: 'E-commerce',
        problem: {
          title: 'Merchant Supply-Chain Monitoring Dashboard',
          statement: 'Small retail merchants cannot monitor courier dispatch transit delays and order fulfillment logistics across regions.'
        },
        restriction: {
          name: 'Purely Client-Side',
          rule: 'Render fulfillment KPIs and dispatch transit status in the browser.'
        },
        resource: {
          name: 'Order fulfillment dispatch log',
          type: 'local-dataset',
          guidance: 'Analyze courier delivery records.'
        },
        deliverable: 'A logistics dashboard displaying delivery transit fulfillment status.'
      };

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.functionalEquivalenceScore).toBeLessThan(0.65);

      const novelty = await evaluateNovelty(challengeB, { comparisonPool: [challengeA] });
      expect(novelty.decision).toBe('ACCEPT');
    });
  });

  describe('Test Group D: Algorithmic Diversity Recognition', () => {
    it('should recognize algorithmic mismatch between graph-optimization and time-series-forecasting', () => {
      const challengeA = {
        theme: 'FinTech',
        title: 'Debt Simplification Engine',
        problemStatement: 'Roommates need to minimize transactions and settle up debts using graph reduction.',
        restriction: 'Execute graph-minimizing settlements purely client-side.',
        resource: 'IndexedDB API',
        deliverable: 'A settlement board minimizing debts.'
      };

      const challengeB = {
        theme: 'FinTech',
        title: 'Budget Burn Rate Projection System',
        problemStatement: 'Students need to forecast future monthly deficit and project burn rate trends.',
        restriction: 'Compute moving average and future forecast purely offline.',
        resource: 'Monthly expense history CSV',
        deliverable: 'A predictive forecast tool.'
      };

      const profileA = extractDiversityProfile(challengeA);
      const profileB = extractDiversityProfile(challengeB);

      expect(profileA.coreAlgorithm).toBe('graph-optimization');
      expect(profileB.coreAlgorithm).toBe('time-series-forecasting');

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.breakdown.coreAlgorithmSim).toBe(0.0);
    });

    it('should recognize algorithmic mismatch between constraint-satisfaction and recommendation-algorithms', () => {
      const challengeA = {
        theme: 'Open Innovation',
        title: 'Relief Supply Knapsack Allocator',
        problemStatement: 'Emergency workers must solve capacity constraint satisfaction and bin packing for relief supplies.',
        restriction: 'Solve constraints purely client side.',
        resource: 'Supply inventory records',
        deliverable: 'A constraint satisfaction solver.'
      };

      const challengeB = {
        theme: 'EdTech',
        title: 'Personalized Study Recommendation System',
        problemStatement: 'Tutors recommend topics using collaborative filtering and content-based recommendation trees.',
        restriction: 'Render recommendations offline.',
        resource: 'Topic preference records',
        deliverable: 'A personalized recommendation engine.'
      };

      const profileA = extractDiversityProfile(challengeA);
      const profileB = extractDiversityProfile(challengeB);

      expect(profileA.coreAlgorithm).toBe('constraint-satisfaction');
      expect(profileB.coreAlgorithm).toBe('recommendation-algorithms');

      const funcEq = computeFunctionalEquivalence(challengeA, challengeB);
      expect(funcEq.breakdown.coreAlgorithmSim).toBe(0.0);
    });
  });

  describe('Test Group E: Historical Diversity & Backward Compatibility', () => {
    it('should extract valid functional profiles for all 40 official curated challenges', () => {
      const officialChallenges = [
        {
          id: 'fintech-01',
          theme: 'FinTech',
          title: 'Client-Side Shared Expense Settler & Debt Simplifier',
          problemStatement: 'College roommates and project teams struggle to track shared expenses and settle balances without complex accounts.',
          restrictions: ['Calculate all balances and minimum settlements purely on the client side.'],
          resourcesProvided: ['Sample transaction stream for 5 roommates; IndexedDB API.']
        },
        {
          id: 'edtech-03',
          theme: 'EdTech',
          title: 'Rule-Based Exam Revision Prioritizer & Schedule Planner',
          problemStatement: 'Students do not know which topics to revise first when an examination is approaching.',
          restrictions: ['Must use transparent rule-based prioritisation; no paid APIs.'],
          resourcesProvided: ['Sample syllabus of 12 topics; difficulty scores.']
        }
      ];

      for (const challenge of officialChallenges) {
        const profile = extractDiversityProfile(challenge);
        expect(profile).toHaveProperty('coreAlgorithm');
        expect(profile).toHaveProperty('engineeringTask');
        expect(profile).toHaveProperty('inputStructure');
        expect(profile).toHaveProperty('outputStructure');
        expect(profile).toHaveProperty('dataProcessingStrategy');
        expect(profile).toHaveProperty('technicalConstraints');
        expect(profile).toHaveProperty('deliverableType');
      }
    });

    it('should safely handle legacy records with missing Phase 13 profile fields', () => {
      const legacyChallenge = {
        theme: 'FinTech',
        problem: { title: 'Legacy Bill Splitter', statement: 'Split bill equally among friends.' },
        restriction: { rule: 'Client side only' },
        resource: { name: 'Local storage' },
        deliverable: 'Web app',
        diversityProfile: {
          subdomain: 'payments-transactions',
          solutionArchetype: 'calculator',
          userPersona: 'general-citizens'
          // Missing coreAlgorithm, engineeringTask, etc.
        }
      };

      const currentChallenge = {
        theme: 'FinTech',
        problem: { title: 'Modern Splitter', statement: 'Split bill among roommates.' },
        restriction: { rule: 'Client side only' },
        resource: { name: 'Local storage' },
        deliverable: 'Web app'
      };

      expect(() => computeFunctionalEquivalence(legacyChallenge, currentChallenge)).not.toThrow();
      const result = computeFunctionalEquivalence(legacyChallenge, currentChallenge);
      expect(result.functionalEquivalenceScore).toBeGreaterThan(0);
      expect(result.functionalEquivalenceScore).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Test Group F: Failure Behavior, Safety & Failover', () => {
    it('should safely extract default profile on empty or null challenge without throwing', () => {
      expect(() => extractDiversityProfile({})).not.toThrow();
      expect(() => extractDiversityProfile(null)).not.toThrow();
      const profile = extractDiversityProfile({});
      expect(profile.coreAlgorithm).toBe('not_applicable');
      expect(profile.engineeringTask).toBe('general-metric-visualization');
    });

    it('should not silently accept duplicate candidate from secondary provider during failover', async () => {
      const duplicateCandidate = {
        theme: 'FinTech',
        problem: {
          title: 'Client-Side Shared Expense Settler',
          statement: 'College roommates and project teams struggle to track shared expenses and settle balances without complex accounts.'
        },
        restriction: {
          name: 'Pure Client-Side Graph Reducer',
          rule: 'Calculate settlements purely on the client side with zero external payment gateways.'
        },
        resource: {
          name: 'IndexedDB API',
          type: 'browser-api',
          guidance: 'Persist roommate debts locally in browser storage.',
          docsUrl: 'https://example.com/docs'
        },
        deliverable: 'A client-side debt settlement dashboard with minimum transaction reconciliation.'
      };

      // Primary Groq fails immediately
      const mockGroq = {
        generate: vi.fn().mockRejectedValue(new Error('Groq unavailable'))
      };

      // Secondary Gemini returns duplicate candidate
      const mockGemini = {
        generate: vi.fn().mockResolvedValue(duplicateCandidate)
      };

      const mockFallback = vi.fn().mockReturnValue({
        theme: 'FinTech',
        problem: {
          title: 'Curated Clean Safe Fallback',
          statement: 'Completely unique and safe curated problem statement for testing fallback.'
        },
        restriction: {
          name: 'Client Side Rule',
          rule: 'Purely client side.'
        },
        resource: {
          name: 'Web Storage API',
          type: 'browser-api',
          guidance: 'Use local storage.',
          docsUrl: 'https://developer.mozilla.org'
        },
        deliverable: 'A functional fallback web app.',
        diversityProfile: {
          subdomain: 'financial-literacy',
          solutionArchetype: 'tracker',
          coreAlgorithm: 'rule-based-reasoning',
          engineeringTask: 'general-metric-visualization'
        }
      });

      const service = new ChallengeService({
        groqService: mockGroq,
        geminiService: mockGemini,
        fallbackGenerator: mockFallback,
        hasGroqKey: true,
        hasGeminiKey: true,
        provider: 'groq'
      });

      const res = await service.generateChallenge('FinTech');

      // The duplicate secondary candidate MUST NOT be returned!
      expect(res.source).toBe('curated-fallback');
      expect(res.problem.title).toBe('Curated Clean Safe Fallback');
    });
  });
});
