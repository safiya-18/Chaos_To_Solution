import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { ChallengeService } from '../../src/services/challengeService.js';
import { getGroundingContext } from '../../src/services/groundingService.js';
import { evaluateNovelty } from '../../src/services/noveltyService.js';
import { generateFallback, generateOfficialFallback, getOfficialCuratedChallenges } from '../../src/services/fallbackService.js';
import { validateThemeConstraints } from '../../src/utils/themeConstraintValidator.js';
import { validateChallenge } from '../../src/utils/challengeValidator.js';
import officialCuratedChallenges from '../../src/data/officialCuratedChallenges.json' with { type: 'json' };

describe('Phase 3 & 4: Four Themes Grounding, Constraint Enforcement & Pipeline Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Grounding Context & Prompt Injection Verification
  // =========================================================================
  describe('1. Grounding Context & Provenance Injection across All 4 Themes', () => {
    const themes = ['FinTech', 'Sustainability', 'EdTech', 'Open Innovation'];

    it.each(themes)('should retrieve grounding context with theme constraints and provenance for %s', async (theme) => {
      const context = await getGroundingContext(theme);

      expect(context).toBeDefined();
      expect(context).toContain('THEME SPECIFIC CONSTRAINTS:');
      expect(context).toContain('OFFICIAL CURATED THEME CHALLENGES FOR');
      expect(context).toContain('IMPORTANT PROVENANCE MANDATE');
      expect(context).toContain('Never present AI-generated suggestions as resources officially supplied');
      expect(context).toContain('AVAILABLE VERIFIED ONLINE RESOURCES FOR THIS DOMAIN');

      // Ensure length stays compact and within prompt budget
      expect(context.length).toBeLessThan(3500);
    });

    it('should inject FinTech-specific mandatory guidelines into prompt context', async () => {
      const context = await getGroundingContext('FinTech');
      expect(context).toContain('FINTECH MANDATES: Client-side settlements only');
      expect(context).toContain('no live UPI/banking credentials');
    });

    it('should inject Sustainability-specific mandatory guidelines into prompt context', async () => {
      const context = await getGroundingContext('Sustainability');
      expect(context).toContain('SUSTAINABILITY MANDATES: Simulated mess/sensor logs only');
      expect(context).toContain('no live GPS tracking');
    });

    it('should inject EdTech-specific mandatory guidelines into prompt context', async () => {
      const context = await getGroundingContext('EdTech');
      expect(context).toContain('EDTECH MANDATES: Display original notes alongside simplified text');
      expect(context).toContain('never execute submitted code on server');
    });

    it('should inject Open Innovation-specific mandatory guidelines into prompt context', async () => {
      const context = await getGroundingContext('Open Innovation');
      expect(context).toContain('OPEN INNOVATION MANDATES: Clearly label simulated safety without route safety guarantees');
      expect(context).toContain('no camera/vehicle tracking');
    });
  });

  // =========================================================================
  // 2. End-to-End Generation & Grounded Variations (2 distinct records per theme)
  // =========================================================================
  describe('2. End-to-End Generation & Grounded Variations (2 records per theme)', () => {
    // --- FinTech ---
    it('FinTech Record 1 (fintech-01): should generate client-side expense settlement variation', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async (theme, history, options) => {
          expect(options.groundingContext).toContain('FinTech');
          return {
            theme: 'FinTech',
            problem: {
              title: 'Graph-Minimizing Dorm Bill Settlement Board',
              statement: 'Student project teammates need to track shared supplies and resolve group debts with minimal total payment transactions.'
            },
            restriction: {
              name: 'Pure Client-Side Graph Reducer',
              rule: 'Calculate settlements purely on the client side; zero external payment gateways or backend servers allowed.'
            },
            resource: {
              name: 'IndexedDB API',
              type: 'browser-api',
              guidance: 'Persist roommate debts locally in browser storage and execute debt minimization offline.',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API'
            },
            deliverable: 'A client-side interactive debt settlement dashboard with minimum transaction reconciliation.'
          };
        })
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback
      });

      const result = await service.generateChallenge('FinTech');
      expect(result.source).toBe('ai');
      expect(result.problem.title).toBe('Graph-Minimizing Dorm Bill Settlement Board');
      expect(result.restriction.rule).toContain('purely on the client side');
      expect(validateChallenge(result, 'FinTech').isValid).toBe(true);

      const constraintCheck = validateThemeConstraints(result, 'FinTech');
      expect(constraintCheck.passed).toBe(true);
    });

    it('FinTech Record 2 (fintech-05): should generate simulated micro-savings round-up variation', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => ({
          theme: 'FinTech',
          problem: {
            title: 'Virtual Pocket Change Round-Up Vault',
            statement: 'College students struggle to save pocket money consistently without disrupting everyday food and transit spending.'
          },
          restriction: {
            name: 'Simulated Wallet Only',
            rule: 'Must use simulated wallet transactions; do not store or collect real banking credentials or live UPI data.'
          },
          resource: {
            name: 'Web Storage API',
            type: 'browser-api',
            guidance: 'Store simulated transaction logs and accumulated round-up pennies in local storage.',
            docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API'
          },
          deliverable: 'A dashboard that simulates debit transactions and rounds up each amount to the nearest ten rupees.'
        }))
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback
      });

      const result = await service.generateChallenge('FinTech');
      expect(result.source).toBe('ai');
      expect(result.problem.title).toBe('Virtual Pocket Change Round-Up Vault');
      expect(validateThemeConstraints(result, 'FinTech').passed).toBe(true);
    });

    // --- Sustainability ---
    it('Sustainability Record 1 (sustainability-01): should generate simulated mess waste variation', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => ({
          theme: 'Sustainability',
          problem: {
            title: 'Dining Hall Attendance & Waste Pre-Batch Forecaster',
            statement: 'Hostel mess canteens generate excessive meal waste because batch preparation quantities are not aligned with attendance patterns.'
          },
          restriction: {
            name: 'Simulated Mess Logs Only',
            rule: 'Use simulated mess records only; zero live hardware scale integrations permitted.'
          },
          resource: {
            name: 'HTML5 Canvas 2D API',
            type: 'browser-api',
            guidance: 'Plot historical waste vs attendance trends using Canvas programmatically on client side.',
            docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API'
          },
          deliverable: 'A predictive meal batch planning interface showing recommended cooking quantities.'
        }))
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback
      });

      const result = await service.generateChallenge('Sustainability');
      expect(result.source).toBe('ai');
      expect(validateThemeConstraints(result, 'Sustainability').passed).toBe(true);
    });

    it('Sustainability Record 2 (sustainability-04): should generate e-waste locator without GPS tracking', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => ({
          theme: 'Sustainability',
          problem: {
            title: 'Certified Campus E-Waste Drop-off Directory',
            statement: 'Households and students hoard obsolete batteries and gadgets because verified recycling drop-off centers are hard to locate.'
          },
          restriction: {
            name: 'No Live Tracking Policy',
            rule: 'Must use only supplied facility records; no personal contact data collection or live GPS tracking.'
          },
          resource: {
            name: 'OpenStreetMap with Leaflet',
            type: 'open-source-library',
            guidance: 'Render certified e-waste kiosks from supplied GeoJSON dataset without tracking location.',
            docsUrl: 'https://leafletjs.com/reference.html'
          },
          deliverable: 'An interactive static map displaying certified collection centers with battery and device categories.'
        }))
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback
      });

      const result = await service.generateChallenge('Sustainability');
      expect(validateThemeConstraints(result, 'Sustainability').passed).toBe(true);
    });

    // --- EdTech ---
    it('EdTech Record 1 (edtech-01): should generate dual-pane note simplifier variation', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => ({
          theme: 'EdTech',
          problem: {
            title: 'Dual-View Academic Prose Simplifier',
            statement: 'Students struggle to understand complex academic material written in dense prose and specialized jargon.'
          },
          restriction: {
            name: 'Dual-Pane Text Preservation',
            rule: 'Must work with supplied text and display the original alongside the simplified version.'
          },
          resource: {
            name: 'Web Speech API',
            type: 'browser-api',
            guidance: 'Read key bullet points aloud while highlighting sentences in both panes.',
            docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API'
          },
          deliverable: 'A split-screen study console showing unedited textbook excerpts side-by-side with simplified key points.'
        }))
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback
      });

      const result = await service.generateChallenge('EdTech');
      expect(validateThemeConstraints(result, 'EdTech').passed).toBe(true);
    });

    it('EdTech Record 2 (edtech-08): should generate offline error explainer without server execution', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => ({
          theme: 'EdTech',
          problem: {
            title: 'Beginner Syntax & Compiler Diagnostics Mentor',
            statement: 'Novice programmers struggle to interpret cryptic compiler error messages and stack traces.'
          },
          restriction: {
            name: 'No Server Execution',
            rule: 'Must use the supplied error library; do not execute arbitrary submitted code on a server.'
          },
          resource: {
            name: 'Web Workers API',
            type: 'browser-api',
            guidance: 'Tokenize and pattern-match code strings safely in a browser web worker.',
            docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API'
          },
          deliverable: 'An offline compiler error explainer providing plain-English root causes and fixes.'
        }))
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback
      });

      const result = await service.generateChallenge('EdTech');
      expect(validateThemeConstraints(result, 'EdTech').passed).toBe(true);
    });

    // --- Open Innovation ---
    it('Open Innovation Record 1 (open-innovation-01): should generate walking route without safety guarantee', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => ({
          theme: 'Open Innovation',
          problem: {
            title: 'Nighttime Streetlight & Hazard Route Advisor',
            statement: 'Pedestrians cannot easily identify well-lit walking alternatives when some corridors have reported hazards.'
          },
          restriction: {
            name: 'Simulated Advisory Notice',
            rule: 'Must use only supplied route data; clearly label simulated safety information and do not guarantee a route is safe.'
          },
          resource: {
            name: 'OpenStreetMap with Leaflet',
            type: 'open-source-library',
            guidance: 'Display street segments with hazard overlays from supplied GeoJSON.',
            docsUrl: 'https://leafletjs.com/reference.html'
          },
          deliverable: 'A route exploration map visualizing reported street lighting levels with alternative pedestrian paths.'
        }))
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback
      });

      const result = await service.generateChallenge('Open Innovation');
      expect(validateThemeConstraints(result, 'Open Innovation').passed).toBe(true);
    });

    it('Open Innovation Record 2 (open-innovation-04): should generate parking dashboard without camera feeds', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => ({
          theme: 'Open Innovation',
          problem: {
            title: 'Campus Parking Zone Availability Estimator',
            statement: 'Drivers waste time searching for open spaces across crowded campus lots during morning rush hours.'
          },
          restriction: {
            name: 'Sample Data Only',
            rule: 'No live camera feeds, facial recognition, or vehicle tracking.'
          },
          resource: {
            name: 'HTML5 Canvas API',
            type: 'browser-api',
            guidance: 'Draw parking zone occupancy bars from sample JSON readings.',
            docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API'
          },
          deliverable: 'A parking status monitor calculating occupied percentages and estimated open spots by zone.'
        }))
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback
      });

      const result = await service.generateChallenge('Open Innovation');
      expect(validateThemeConstraints(result, 'Open Innovation').passed).toBe(true);
    });
  });

  // =========================================================================
  // 3. Real Rejection Path: Banned Rules & Constraint Enforcement
  // =========================================================================
  describe('3. Real Pipeline Rejection Path & Failover on Theme Constraint Breach', () => {
    it('should reject a candidate attempting live UPI integration in FinTech and retry/failover', async () => {
      let attempts = 0;
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => {
          attempts++;
          if (attempts === 1) {
            // First attempt violates FinTech live UPI mandate
            return {
              theme: 'FinTech',
              problem: {
                title: 'Instant Live UPI Collector',
                statement: 'Collect user live UPI data and bank account credentials for direct fund transfers.'
              },
              restriction: {
                name: 'Direct UPI Connection',
                rule: 'Authenticate with live banking credentials and process UPI transfers.'
              },
              resource: {
                name: 'Razorpay UPI API',
                type: 'public-api',
                guidance: 'Process live bank account transactions.',
                docsUrl: 'https://razorpay.com/docs'
              },
              deliverable: 'A functional UPI checkout prototype.'
            };
          }
          // Second attempt complies
          return {
            theme: 'FinTech',
            problem: {
              title: 'Client-Side Group Expense Splitter',
              statement: 'Roommates calculate settlement transactions without servers or payment gateways.'
            },
            restriction: {
              name: 'Pure Client Calculations',
              rule: 'Must calculate settlements purely on the client side; zero payment gateways.'
            },
            resource: {
              name: 'Web Storage API',
              type: 'browser-api',
              guidance: 'Store roommate ledger locally.',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API'
            },
            deliverable: 'An offline-capable group expense settlement dashboard.'
          };
        })
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback,
        maxNoveltyRetries: 2
      });

      const result = await service.generateChallenge('FinTech');
      expect(attempts).toBe(2);
      expect(result.problem.title).toBe('Client-Side Group Expense Splitter');
      expect(validateThemeConstraints(result, 'FinTech').passed).toBe(true);
    });

    it('should reject an EdTech candidate executing code on server and engage fallback', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => ({
          theme: 'EdTech',
          problem: {
            title: 'Remote Sandbox Code Evaluator',
            statement: 'Students submit arbitrary code executed on a server container to check runtime bugs.'
          },
          restriction: {
            name: 'Remote Execution Required',
            rule: 'Execute arbitrary submitted code on a server.'
          },
          resource: {
            name: 'Web Storage API',
            type: 'browser-api',
            guidance: 'Run untrusted code.',
            docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API'
          },
          deliverable: 'A remote container code runner.'
        }))
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        fallbackGenerator: generateFallback,
        maxNoveltyRetries: 1
      });

      const result = await service.generateChallenge('EdTech');
      // Must engage curated fallback rather than returning illegal candidate
      expect(result.source).toBe('curated-fallback');
      expect(validateThemeConstraints(result, 'EdTech').passed).toBe(true);
    });
  });

  // =========================================================================
  // 4. Duplicate Prevention against 40 Official Challenges
  // =========================================================================
  describe('4. Novelty & Duplicate Prevention against 40 Official Challenges', () => {
    it('should detect an exact copy of an official FinTech challenge as duplicate', async () => {
      const official = officialCuratedChallenges.find((c) => c.id === 'fintech-01');
      expect(official).toBeDefined();

      const candidate = {
        theme: 'FinTech',
        problem: {
          title: official.title,
          statement: official.problemStatement
        },
        restriction: {
          name: 'Client-Side Settlement',
          rule: official.restrictions[0]
        },
        resource: {
          name: official.resourcesProvided[0],
          type: 'open-source-dataset'
        }
      };

      const novelty = await evaluateNovelty(candidate);
      expect(novelty.decision).toBe('REJECT');
      expect(novelty.similarityScores.problemSimilarity).toBeGreaterThanOrEqual(0.70);
      expect(novelty.reasons.length).toBeGreaterThan(0);
    });

    it('should detect an exact copy of an official Sustainability challenge as duplicate', async () => {
      const official = officialCuratedChallenges.find((c) => c.id === 'sustainability-01');
      expect(official).toBeDefined();

      const candidate = {
        theme: 'Sustainability',
        problem: {
          title: official.title,
          statement: official.problemStatement
        },
        restriction: {
          name: 'Simulated Mess Only',
          rule: official.restrictions[0]
        },
        resource: {
          name: 'Chart.js',
          type: 'open-source-library'
        }
      };

      const novelty = await evaluateNovelty(candidate);
      expect(novelty.decision).toBe('REJECT');
      expect(novelty.similarityScores.problemSimilarity).toBeGreaterThanOrEqual(0.70);
    });
  });

  // =========================================================================
  // 5. Fallback Generation for All 4 Themes
  // =========================================================================
  describe('5. Fallback Generation & Official Curated Fallbacks', () => {
    const themes = ['FinTech', 'Sustainability', 'EdTech', 'Open Innovation'];

    it.each(themes)('should generate a valid official curated fallback for %s', (theme) => {
      const official = generateOfficialFallback(theme);

      expect(official.theme).toBe(theme);
      expect(official.isOfficialCurated).toBe(true);
      expect(official.curatedId).toBeDefined();
      expect(official.problem.title).toBeDefined();
      expect(official.problem.statement).toBeDefined();
      expect(official.restriction.rule).toBeDefined();
      expect(official.resource.name).toBeDefined();

      const validation = validateChallenge(official, theme);
      expect(validation.isValid).toBe(true);

      const constraintCheck = validateThemeConstraints(official, theme);
      expect(constraintCheck.passed).toBe(true);
    });

    it('should return 10 official challenges when querying getOfficialCuratedChallenges by theme', () => {
      for (const t of ['FinTech', 'Sustainability', 'EdTech', 'Open Innovation']) {
        const matches = getOfficialCuratedChallenges(t);
        expect(matches).toHaveLength(10);
      }
    });
  });

  // =========================================================================
  // 6. REST API Endpoint Integration
  // =========================================================================
  describe('6. REST API POST /api/challenges/generate across All 4 Themes', () => {
    const themes = ['FinTech', 'Sustainability', 'EdTech', 'Open Innovation'];

    it.each(themes)('should respond with 200 OK and valid challenge triad for %s', async (theme) => {
      const res = await request(app)
        .post('/api/challenges/generate')
        .send({ theme })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.theme).toBe(theme);
      expect(res.body.data.challenge).toBeDefined();
      expect(res.body.data.challenge.problem.title).toBeDefined();
      expect(res.body.data.challenge.problem.statement).toBeDefined();
      expect(res.body.data.challenge.restriction.rule).toBeDefined();
      expect(res.body.data.challenge.resource.name).toBeDefined();
      expect(res.body.data.challenge.deliverable).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.shareText).toBeDefined();
    });
  });
});
