import { describe, it, expect } from 'vitest';
import { validateThemeConstraints, getThemeConstraintGuidelines } from '../../src/utils/themeConstraintValidator.js';
import officialCuratedChallenges from '../../src/data/officialCuratedChallenges.json' with { type: 'json' };

describe('Phase 4: Theme Constraint Validator Unit & Regression Suite', () => {
  describe('1. Guidelines & Setup', () => {
    it('should return non-empty guidelines for the 4 core themes', () => {
      expect(getThemeConstraintGuidelines('FinTech')).toContain('FINTECH MANDATES');
      expect(getThemeConstraintGuidelines('Sustainability')).toContain('SUSTAINABILITY MANDATES');
      expect(getThemeConstraintGuidelines('EdTech')).toContain('EDTECH MANDATES');
      expect(getThemeConstraintGuidelines('Open Innovation')).toContain('OPEN INNOVATION MANDATES');
    });

    it('should return empty string for unknown themes', () => {
      expect(getThemeConstraintGuidelines('UnknownTheme')).toBe('');
    });
  });

  describe('2. All 40 Official Curated Challenges Validation', () => {
    it('should pass theme constraint validation for every official challenge', () => {
      for (const challenge of officialCuratedChallenges) {
        const candidate = {
          theme: challenge.theme,
          problem: {
            title: challenge.title,
            statement: challenge.problemStatement
          },
          restriction: {
            name: `${challenge.theme} Rule`,
            rule: challenge.restrictions.join('; ')
          },
          resource: {
            name: challenge.resourcesProvided[0] || 'Official Dataset',
            type: 'open-source-dataset',
            guidance: challenge.resourcesProvided.join('; ')
          },
          deliverable: 'A working 3-hour prototype strictly conforming to official constraints.'
        };

      const { passed, violations } = validateThemeConstraints(candidate, challenge.theme);
      expect(passed).toBe(true);
      expect(violations).toEqual([]);
      }
    });
  });

  describe('3. FinTech Constraint Violations', () => {
    it('should reject real banking credentials or live UPI integrations', () => {
      const candidate = {
        theme: 'FinTech',
        problem: {
          title: 'Direct UPI Payee Wallet',
          statement: 'Collect user live UPI data and bank account credentials for real-time fund transfers.'
        },
        restriction: {
          name: 'Real Bank Auth',
          rule: 'Connect with real banking credentials.'
        },
        resource: {
          name: 'Razorpay UPI API',
          type: 'public-api',
          guidance: 'Process live bank account transactions.'
        },
        deliverable: 'A prototype connecting to real UPI accounts.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'FinTech');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.includes('live UPI') || v.includes('banking credentials'))).toBe(true);
    });

    it('should reject external payment gateways when client-side settlement is mandated', () => {
      const candidate = {
        theme: 'FinTech',
        problem: {
          title: 'Roommate Bill Splitter Gateway',
          statement: 'A tool for roommates to settle up shared apartment expenses.'
        },
        restriction: {
          name: 'Payment Gateway Integration',
          rule: 'Route transactions via external payment gateway server.'
        },
        resource: {
          name: 'Stripe API',
          type: 'public-api',
          guidance: 'Handle checkout through Stripe server.'
        },
        deliverable: 'A prototype with server-side settlement calculations.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'FinTech');
      expect(violations.some((v) => v.includes('payment gateway') || v.includes('backend server'))).toBe(true);
    });

    it('should reject crypto conversion for time-credit ledger challenges', () => {
      const candidate = {
        theme: 'FinTech',
        problem: {
          title: 'Student Skill Time Bank with Crypto Tokens',
          statement: 'Students trade tutoring hours converted to crypto tokens on Ethereum.'
        },
        restriction: {
          name: 'Crypto Exchange',
          rule: 'Convert time credits into crypto tokens for liquidity.'
        },
        resource: {
          name: 'Web3.js',
          type: 'open-source-library',
          guidance: 'Mint crypto tokens.'
        },
        deliverable: 'A decentralized skill exchange.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'FinTech');
      expect(violations.some((v) => v.includes('crypto token') || v.includes('fiat'))).toBe(true);
    });
  });

  describe('4. Sustainability Constraint Violations', () => {
    it('should reject live hardware scale integrations for campus mess waste', () => {
      const candidate = {
        theme: 'Sustainability',
        problem: {
          title: 'Live Canteen Waste Scale Logger',
          statement: 'Connect live hardware scale to measure campus mess food waste automatically.'
        },
        restriction: {
          name: 'Hardware IoT Scale',
          rule: 'Require live hardware scale integration.'
        },
        resource: {
          name: 'IoT Sensor SDK',
          type: 'open-source-library',
          guidance: 'Read from physical scale.'
        },
        deliverable: 'A smart mess scale dashboard.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'Sustainability');
      expect(violations.some((v) => v.includes('live hardware scale'))).toBe(true);
    });

    it('should reject live GPS tracking for recycling centers', () => {
      const candidate = {
        theme: 'Sustainability',
        problem: {
          title: 'Household E-Waste Drop-Off Locator',
          statement: 'Locate certified e-waste kiosks with live GPS tracking of user coordinates.'
        },
        restriction: {
          name: 'Continuous Tracking',
          rule: 'Use live GPS tracking for recycling kiosks.'
        },
        resource: {
          name: 'Geolocation API',
          type: 'browser-api',
          guidance: 'Track continuous GPS coordinates.'
        },
        deliverable: 'An e-waste locator with real-time tracking.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'Sustainability');
      expect(violations.some((v) => v.includes('live GPS tracking'))).toBe(true);
    });

    it('should reject paid GIS APIs for rainwater harvesting', () => {
      const candidate = {
        theme: 'Sustainability',
        problem: {
          title: 'Rooftop Rainwater Harvest Calculator',
          statement: 'Calculate rooftop rainwater yield using paid Google Maps GIS satellite elevation API.'
        },
        restriction: {
          name: 'Commercial GIS',
          rule: 'Integrate paid GIS APIs for roof contours.'
        },
        resource: {
          name: 'Google Maps Solar API',
          type: 'public-api',
          guidance: 'Fetch paid GIS rooftop polygons.'
        },
        deliverable: 'A rooftop calculator.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'Sustainability');
      expect(violations.some((v) => v.includes('paid GIS'))).toBe(true);
    });

    it('should reject cash transactions for student tool/book exchange', () => {
      const candidate = {
        theme: 'Sustainability',
        problem: {
          title: 'Discarded Textbook & Lab Coat Resale Shop',
          statement: 'Students buy and sell used engineering lab coats and textbooks for cash payments.'
        },
        restriction: {
          name: 'Cash Checkout',
          rule: 'Permit cash payments and credit card checkout.'
        },
        resource: {
          name: 'Stripe API',
          type: 'public-api',
          guidance: 'Handle textbook sales.'
        },
        deliverable: 'A student resale marketplace.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'Sustainability');
      expect(violations.some((v) => v.includes('No cash transactions allowed'))).toBe(true);
    });
  });

  describe('5. EdTech Constraint Violations', () => {
    it('should reject executing arbitrary submitted code on a server', () => {
      const candidate = {
        theme: 'EdTech',
        problem: {
          title: 'Online Code Runner & Compiler Sandbox',
          statement: 'Execute arbitrary submitted code on a remote backend server to identify runtime errors.'
        },
        restriction: {
          name: 'Remote Execution',
          rule: 'Execute arbitrary submitted code on a server.'
        },
        resource: {
          name: 'Judge0 API',
          type: 'public-api',
          guidance: 'Execute untrusted code on container servers.'
        },
        deliverable: 'An online code execution sandbox.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'EdTech');
      expect(violations.some((v) => v.includes('arbitrary submitted code'))).toBe(true);
    });

    it('should reject LMS integration and student login for assignment processing', () => {
      const candidate = {
        theme: 'EdTech',
        problem: {
          title: 'Canvas LMS Assignment Importer',
          statement: 'Students log in with Canvas LMS credentials to extract assignment deadlines.'
        },
        restriction: {
          name: 'LMS Connect',
          rule: 'Require student login and LMS integration.'
        },
        resource: {
          name: 'Canvas LMS REST API',
          type: 'public-api',
          guidance: 'Import courses and student profiles.'
        },
        deliverable: 'A dashboard synchronized with Canvas.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'EdTech');
      expect(violations.some((v) => v.includes('LMS integration') || v.includes('student login'))).toBe(true);
    });

    it('should reject student ranking or public leaderboard in doubt board', () => {
      const candidate = {
        theme: 'EdTech',
        problem: {
          title: 'Classroom Competitive Doubt Leaderboard',
          statement: 'Rank students on a public leaderboard based on upvoted classroom questions.'
        },
        restriction: {
          name: 'Public Rankings',
          rule: 'Include student ranking and public popularity rankings.'
        },
        resource: {
          name: 'React Starter',
          type: 'open-source-library',
          guidance: 'Display top student ranks.'
        },
        deliverable: 'A gamified question board.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'EdTech');
      expect(violations.some((v) => v.includes('ranking') || v.includes('popularity rankings'))).toBe(true);
    });
  });

  describe('6. Open Innovation Constraint Violations', () => {
    it('should reject claiming a route is guaranteed safe', () => {
      const candidate = {
        theme: 'Open Innovation',
        problem: {
          title: 'Guaranteed Safe Walking Route Navigator',
          statement: 'Guarantee a route is 100% safe for nighttime walking using hazard maps.'
        },
        restriction: {
          name: 'Safe Guarantee',
          rule: 'Guarantee a route is safe.'
        },
        resource: {
          name: 'Leaflet.js',
          type: 'open-source-library',
          guidance: 'Plot verified danger-free routes.'
        },
        deliverable: 'A navigator that guarantees complete personal safety.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'Open Innovation');
      expect(violations.some((v) => v.includes('guarantee a route is safe'))).toBe(true);
    });

    it('should reject facial recognition and vehicle tracking for campus parking', () => {
      const candidate = {
        theme: 'Open Innovation',
        problem: {
          title: 'Automated License Plate & Facial Recognition Parking',
          statement: 'Track parking space occupancy using live camera feeds, facial recognition, and vehicle tracking.'
        },
        restriction: {
          name: 'Camera Tracking',
          rule: 'Install live camera feeds and facial recognition.'
        },
        resource: {
          name: 'OpenCV',
          type: 'open-source-library',
          guidance: 'Recognize vehicle plates and faces.'
        },
        deliverable: 'A surveillance parking system.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'Open Innovation');
      expect(violations.some((v) => v.includes('facial recognition') || v.includes('vehicle tracking'))).toBe(true);
    });

    it('should reject medical diagnoses in neighborhood air-quality tool', () => {
      const candidate = {
        theme: 'Open Innovation',
        problem: {
          title: 'Air Quality Respiratory Health Diagnoser',
          statement: 'Analyze pollution sensor data to deliver personal medical diagnoses to residents.'
        },
        restriction: {
          name: 'Medical Advice',
          rule: 'Provide medical diagnoses based on AQI levels.'
        },
        resource: {
          name: 'Chart.js',
          type: 'open-source-library',
          guidance: 'Graph pollution with clinical diagnoses.'
        },
        deliverable: 'A medical diagnostic air quality portal.'
      };

      const { passed, violations } = validateThemeConstraints(candidate, 'Open Innovation');
      expect(violations.some((v) => v.includes('medical diagnoses') || v.includes('emergency medical advice'))).toBe(true);
    });
  });
});
