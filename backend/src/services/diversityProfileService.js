/**
 * Challenge Diversity Profile & Taxonomy Service
 *
 * Implements deterministic classification, profile extraction, and
 * multi-dimensional weighted semantic diversity scoring across the 8 CTS themes.
 */

import { normalizeText } from './ingestionService.js';
import { tokenizeWords } from './noveltyService.js';

export const TRACKED_SOLUTION_ARCHETYPES = Object.freeze([
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
]);

export const THEME_SUBDOMAINS = Object.freeze({
  FinTech: [
    'payments-transactions',
    'fraud-anomaly',
    'lending-repayment',
    'financial-literacy',
    'taxation-compliance',
    'merchant-operations',
    'financial-inclusion',
    'insurance',
    'risk-assessment',
    'financial-privacy'
  ],
  Sustainability: [
    'waste-management',
    'energy-efficiency',
    'carbon-accounting',
    'circular-economy',
    'water-conservation',
    'sustainable-transport',
    'food-waste',
    'renewable-energy',
    'biodiversity',
    'supply-chain-greening'
  ],
  EdTech: [
    'learning-analytics',
    'revision-scheduling',
    'interactive-pedagogy',
    'peer-collaboration',
    'skill-assessment',
    'accessibility-learning',
    'curriculum-mapping',
    'exam-integrity',
    'stem-simulation',
    'gamified-learning'
  ],
  'Open Innovation': [
    'civic-tech',
    'public-transit',
    'community-resilience',
    'smart-campus',
    'disaster-response',
    'open-data-analytics',
    'volunteer-coordination',
    'urban-mobility',
    'crowdsourced-sensing',
    'resource-sharing'
  ],
  HealthTech: [
    'medication-adherence',
    'telehealth-triage',
    'patient-monitoring',
    'clinical-workflow',
    'health-literacy',
    'mental-wellness',
    'nutrition-planning',
    'medical-records-privacy',
    'emergency-dispatch',
    'rehabilitation-tracking'
  ],
  Healthcare: [
    'medication-adherence',
    'telehealth-triage',
    'patient-monitoring',
    'clinical-workflow',
    'health-literacy',
    'mental-wellness',
    'nutrition-planning',
    'medical-records-privacy',
    'emergency-dispatch',
    'rehabilitation-tracking'
  ],
  CyberSecurity: [
    'vulnerability-scanning',
    'credential-protection',
    'phishing-defense',
    'access-control-rbac',
    'incident-response',
    'log-forensics',
    'zero-trust-verification',
    'cryptographic-integrity',
    'network-monitoring',
    'threat-intelligence'
  ],
  AgriTech: [
    'crop-yield-prediction',
    'soil-health-monitoring',
    'precision-irrigation',
    'pest-disease-identification',
    'farm-inventory-logistics',
    'weather-risk-mitigation',
    'market-price-forecasting',
    'livestock-tracking',
    'cold-chain-tracking',
    'organic-certification'
  ],
  'Smart Cities': [
    'traffic-optimization',
    'parking-management',
    'street-lighting-efficiency',
    'air-quality-monitoring',
    'waste-collection-routing',
    'emergency-services-routing',
    'public-wifi-mesh',
    'pedestrian-safety',
    'urban-noise-control',
    'civic-issue-reporting'
  ],
  Accessibility: [
    'screen-reader-enhancement',
    'keyboard-navigation',
    'speech-assistive-tech',
    'visual-contrast-magnification',
    'cognitive-distraction-reduction',
    'motor-impairment-adaptation',
    'sensory-feedback',
    'closed-captioning',
    'simplified-ui-interfaces',
    'multimodal-input'
  ],
  'E-commerce': [
    'checkout-optimization',
    'cart-abandonment-recovery',
    'inventory-allocation',
    'product-recommendation',
    'price-comparison',
    'customer-review-sentiment',
    'order-fulfillment-logistics',
    'dynamic-discounting',
    'return-management',
    'seller-analytics'
  ]
});

function matchesSignal(text, sig) {
  if (!text || !sig) return false;
  if (sig.includes(' ')) {
    return text.includes(sig);
  }
  // Single word requires word boundary with optional inflection (s, es, ed, ing)
  const escaped = sig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}(?:s|es|ed|ing)?\\b`, 'i');
  return regex.test(text);
}

export const ARCHETYPE_SIGNATURES = Object.freeze({
  'optimization-engine': [
    'minimum number of transactions', 'settle up', 'minimize', 'optimize', 'optimal route',
    'knapsack', 'graph simplification', 'debt simplification', 'resource allocation', 'efficient packing',
    'graph-minimizing', 'debt minimization', 'minimization', 'settlement board', 'settlement engine',
    'graph reducer', 'reducer', 'minimum transaction', 'debt resolution', 'transaction reconciliation'
  ],
  'classification-system': [
    'anomaly', 'fraud', 'detect', 'flag', 'classify', 'suspicious', 'micro-charge',
    'filter out', 'phishing', 'malware', 'categorize', 'triage', 'auditor', 'anomaly alert', 'alert'
  ],
  'simulation': [
    'simulator', 'simulation', 'round-up', 'virtual', 'mock transactions', 'what-if',
    'model compound', 'scenario', 'synthetic stream'
  ],
  'matching-system': [
    'matchmaking', 'pair users', 'barter', 'skill exchange', 'time barter', 'bipartite', 'mentor match'
  ],
  'marketplace': [
    'marketplace', 'catalog', 'listing', 'trade', 'buy and sell', 'storefront', 'shopkeeper inventory'
  ],
  'scheduling-system': [
    'schedule', 'calendar', 'spaced-repetition', 'spaced repetition', 'flashcard', 'leitner', 'timetable', 'review interval', 'timeline planner', 'cron'
  ],
  'prediction-system': [
    'forecast', 'predict', 'projection', 'trend', 'future value', 'burn rate projection', 'deficit forecast'
  ],
  'recommendation-engine': [
    'recommend', 'suggest', 'advisory', 'decision tree', 'guidance', 'personalized hint'
  ],
  'data-transformation-tool': [
    'itemize', 'parse', 'extract', 'bilingual', 'tax splitter', 'receipt itemizer', 'format converter', 'csv to json'
  ],
  'accessibility-tool': [
    'speech', 'screen reader', 'keyboard only', 'high contrast', 'wcag', 'voice dictation', 'motor impairment',
    'dyslexia', 'bionic reading', 'assistive', 'accessibility', 'font-scaling', 'color contrast', 'reader tool'
  ],
  'workflow-automation-system': [
    'pipeline', 'automation', 'trigger', 'approval', 'multi-step audit', 'rule-based engine'
  ],
  'resource-allocation-system': [
    'dispatch', 'quota', 'capacity', 'fair share', 'parking occupancy', 'seat allocator', 'rotator', 'round-robin', 'load balance'
  ],
  'calculator': [
    'calculator', 'converter', 'convert amount', 'amortization', 'interest formula', 'tax slab', 'compound growth comparator',
    'roi calculation', 'fee calculator', 'calculate', 'indexer'
  ],
  'tracker': [
    'tracker', 'log', 'burn-rate', 'daily allowance', 'history log', 'audit trail', 'monitor spending'
  ],
  'dashboard': [
    'dashboard', 'visualizer', 'overview', 'chart', 'kpi', 'metrics display', 'interactive summary',
    'risk exposure', 'concentration analyzer', 'analyzer', 'portfolio risk'
  ]
});

export const SUBDOMAIN_SIGNATURES = Object.freeze({
  // FinTech
  'payments-transactions': ['shared expense', 'split bill', 'settle up', 'transaction stream', 'settlement', 'debt'],
  'fraud-anomaly': ['fraud', 'anomaly', 'unauthorized', 'suspicious debit', 'burst transaction', 'micro-charge'],
  'lending-repayment': ['loan', 'amortization', 'interest rate', 'emi', 'borrowing', 'repayment', 'compound interest'],
  'financial-literacy': ['allowance', 'burn rate', 'budgeting', 'student budget', 'financial education', 'money habit'],
  'taxation-compliance': ['tax', 'gst', 'receipt itemizer', 'tax slab', 'compliance', 'invoice tax'],
  'merchant-operations': ['shopkeeper', 'retailer', 'point of sale', 'pos', 'merchant', 'inventory sales'],
  'financial-inclusion': ['micro-savings', 'spare change', 'round-up', 'unbanked', 'informal savings'],
  'insurance': ['insurance', 'premium', 'claim', 'deductible', 'policy risk', 'coverage'],
  'risk-assessment': ['portfolio risk', 'asset allocation', 'volatility', 'concentration risk', 'credit score'],
  'financial-privacy': ['subscription audit', 'privacy-preserving', 'zero personal data', 'credential leak', 'recurring debit'],

  // Sustainability
  'food-waste': ['food waste', 'mess records', 'leftover meal', 'shelf life', 'perishable', 'mess attendance', 'food pantry'],
  'waste-management': ['recycling', 'e-waste', 'landfill', 'segregation', 'compost', 'disposal', 'waste bin', 'kiosk locator'],
  'energy-efficiency': ['kilowatt', 'energy consumption', 'power surge', 'vampire draw', 'thermostat', 'off-hours energy', 'energy audit'],
  'carbon-accounting': ['carbon footprint', 'emission', 'co2', 'greenhouse gas', 'offset', 'carbon sequestration', 'carbon disparity'],
  'circular-economy': ['textbook reuse', 'equipment reuse', 'zero-cash', 'material trade-off', 'life-cycle', 'refurbish', 'reuse hub'],
  'water-conservation': ['water consumption', 'leak detection', 'rainwater', 'irrigation waste', 'runoff', 'water loss', 'leakage'],
  'sustainable-transport': ['bike share', 'carpool', 'walking route', 'transit commute', 'ev charging', 'multi-modal'],
  'renewable-energy': ['solar', 'insolation', 'net-metering', 'photovoltaic', 'inverter', 'wind power', 'clean energy'],
  'biodiversity': ['species', 'wildlife', 'tree growth', 'flora', 'canopy cover', 'urban biodiversity'],
  'supply-chain-greening': ['packaging material', 'supplier emission', 'eco-friendly packaging', 'green logistics'],

  // EdTech
  'revision-scheduling': ['spaced repetition', 'revision schedule', 'forgetting curve', 'exam prep', 'leitner', 'flashcard', 'revision prioritizer'],
  'interactive-pedagogy': ['lecture checkpoint', 'concept explainer', 'interactive exercise', 'visual trace', 'compiler error', 'hint guide', 'diagram explainer', 'visual logic', 'code trace', 'code explanation'],
  'learning-analytics': ['confidence rating', 'mastery score', 'difficulty distribution', 'progress tracking', 'topic-performance', 'knowledge-gap', 'diagnostic dashboard', 'analytics dashboard'],
  'peer-collaboration': ['study group', 'peer tutoring', 'collaborative notes', 'skill barter', 'doubt tracker', 'peer review', 'code review', 'review burden'],
  'skill-assessment': ['quiz', 'micro-quiz', 'rapid assessment', 'quiz performance', 'proficiency', 'rubric', 'assessment score', 'grade distribution', 'assessment feedback'],
  'accessibility-learning': ['dyslexia', 'speech synthesis', 'high contrast reader', 'screen reader', 'speech interface', 'audio narration'],
  'curriculum-mapping': ['syllabus', 'prerequisite tree', 'course roadmap', 'learning path', 'note simplifier', 'summarizer'],
  'exam-integrity': ['proctoring', 'anonymized grading', 'honor code', 'submission hash', 'cheat detection'],
  'stem-simulation': ['physics simulation', 'circuit visualizer', 'molecule model', 'algorithm animator', 'math plotting'],
  'gamified-learning': ['streak', 'leaderboard', 'badge', 'experience points', 'micro-challenge', 'assignment requirement', 'task checklist'],

  // Open Innovation
  'civic-tech': ['pothole', 'street light', 'civic issue', 'neighborhood report', 'public grievance', 'hazard-aware', 'repair status', 'psa simplifier', 'public service announcement'],
  'public-transit': ['bus schedule', 'subway delay', 'commuter route', 'station accessibility', 'transit fleet'],
  'community-resilience': ['volunteer matching', 'mutual aid', 'disaster response', 'emergency supplies', 'relief essential', 'shortage balancer'],
  'smart-campus': ['campus facility', 'dorm occupancy', 'lab reservation', 'study space', 'campus equipment'],
  'disaster-response': ['flood warning', 'wildfire map', 'evacuation zone', 'first aid shelter', 'emergency broadcast'],
  'open-data-analytics': ['census data', 'municipal budget', 'public dataset', 'open street data', 'civic transparency'],
  'volunteer-coordination': ['volunteer shift', 'cause matching', 'community cleanup', 'skill donation'],
  'urban-mobility': ['parking availability', 'occupancy sensor', 'walking safety', 'transit delay', 'route alternative', 'accessible facility route'],
  'crowdsourced-sensing': ['air quality', 'noise sensor', 'heat island', 'fill-level sensor', 'waste bin fill-level'],
  // E-commerce
  'checkout-optimization': ['checkout', 'payment gateway', 'cart total', 'currency conversion', 'shipping fee', 'abandoned cart'],
  'cart-abandonment-recovery': ['cart abandonment', 'abandoned', 'exit intent', 'saved cart'],
  'price-comparison': ['purchasing power', 'parity', 'cost of living', 'price index', 'price comparison', 'market basket', 'remittance', 'currency margin', 'pricing breakdown'],
  'product-recommendation': ['recommendation', 'upsell', 'cross-sell', 'similar products'],
  'inventory-allocation': ['inventory', 'stock', 'warehouse', 'backorder', 'reorder point'],
  'customer-review-sentiment': ['sentiment', 'review analysis', 'customer feedback', 'star rating'],
  'order-fulfillment-logistics': ['dispatch order', 'delivery tracking', 'courier', 'fulfillment'],
  'dynamic-discounting': ['coupon', 'discount code', 'flash sale', 'surge pricing', 'b2b', 'wholesale', 'bulk quote', 'volume discount', 'moq'],
  'return-management': ['refund', 'return label', 'restocking', 'exchange policy'],
  'seller-analytics': ['seller dashboard', 'gross merchandise', 'payout schedule', 'merchant sales']
});

export const PERSONA_SIGNATURES = Object.freeze({
  'students-learners': ['student', 'roommate', 'college', 'exam', 'cram', 'campus', 'dorm', 'academic', 'learner', 'school'],
  'first-time-users': ['first-time', 'beginner', 'amateur', 'novice', 'young adult'],
  'merchants-retailers': ['shopkeeper', 'retailer', 'small business', 'store owner', 'merchant', 'seller', 'wholesale buyer', 'b2b buyer'],
  'freelancers-gig-workers': ['freelancer', 'gig worker', 'consultant', 'contractor', 'tutor', 'remote worker', 'expatriate', 'employee', 'worker', 'courier', 'delivery driver', 'driver', 'rider', 'delivery'],
  'commuters-pedestrians': ['commuter', 'pedestrian', 'transit passenger', 'cyclist', 'driver'],
  'investors-savers': ['investor', 'saver', 'depositor', 'portfolio owner', 'homeowner'],
  'general-citizens': ['citizen', 'resident', 'community member', 'neighborhood resident', 'shopper', 'user', 'buyer']
});

/**
 * Extracts a complete Challenge Diversity Profile from any challenge record or candidate.
 *
 * @param {Object} challenge
 * @returns {Object} Extracted diversity profile
 */
export function extractDiversityProfile(challenge = {}) {
  const theme = challenge.theme || challenge.domain || 'Open Innovation';
  const title = challenge.title || challenge.problem?.title || '';
  const problemStmt = challenge.problemStatement || challenge.problem?.statement || '';
  const deliverable = challenge.deliverable || '';
  const restriction = Array.isArray(challenge.restrictions)
    ? challenge.restrictions.join(' ')
    : `${challenge.restriction?.name || ''} ${challenge.restriction?.rule || ''}`.trim() || (typeof challenge.restriction === 'string' ? challenge.restriction : '');
  const resource = Array.isArray(challenge.resourcesProvided)
    ? challenge.resourcesProvided.join(' ')
    : `${challenge.resource?.name || ''} ${challenge.resource?.guidance || ''}`.trim() || (typeof challenge.resource === 'string' ? challenge.resource : '');

  const fullText = `${title} ${problemStmt} ${deliverable} ${restriction} ${resource}`.toLowerCase();

  // 1. Determine Subdomain
  let detectedSubdomain = 'general-innovation';
  const validSubdomains = THEME_SUBDOMAINS[theme] || THEME_SUBDOMAINS['Open Innovation'];

  let bestSubdomainScore = 0;
  for (const sub of validSubdomains) {
    const sigs = SUBDOMAIN_SIGNATURES[sub] || [sub.replace(/-/g, ' ')];
    let score = 0;
    for (const sig of sigs) {
      if (matchesSignal(fullText, sig)) {
        score += sig.length; // weight longer specific phrases higher
      }
    }
    if (score > bestSubdomainScore) {
      bestSubdomainScore = score;
      detectedSubdomain = sub;
    }
  }

  // Fallback to first theme subdomain if no matches found
  if (bestSubdomainScore === 0 && validSubdomains.length > 0) {
    detectedSubdomain = validSubdomains[0];
  }

  // 2. Determine Solution Archetype
  let detectedArchetype = 'dashboard'; // baseline default
  let bestArchetypeScore = 0;

  for (const [archetype, signals] of Object.entries(ARCHETYPE_SIGNATURES)) {
    let score = 0;
    for (const sig of signals) {
      if (matchesSignal(fullText, sig)) {
        score += sig.length;
      }
    }
    if (score > bestArchetypeScore) {
      bestArchetypeScore = score;
      detectedArchetype = archetype;
    }
  }

  // 3. Determine User Persona
  let detectedPersona = 'general-citizens';
  let bestPersonaScore = 0;
  for (const [persona, signals] of Object.entries(PERSONA_SIGNATURES)) {
    let score = 0;
    for (const sig of signals) {
      if (matchesSignal(fullText, sig)) {
        score += sig.length;
      }
    }
    if (score > bestPersonaScore) {
      bestPersonaScore = score;
      detectedPersona = persona;
    }
  }

  // 4. Derive Primary Workflow
  let primaryWorkflow = 'aggregate-metrics-visualize-kpis';
  if (detectedArchetype === 'optimization-engine') {
    primaryWorkflow = 'import-records-simplify-graph-export';
  } else if (detectedArchetype === 'classification-system') {
    primaryWorkflow = 'stream-ingest-evaluate-rules-alert';
  } else if (detectedArchetype === 'matching-system' || detectedArchetype === 'marketplace') {
    primaryWorkflow = 'profile-creation-matchmaking-transaction-ledger';
  } else if (detectedArchetype === 'calculator') {
    primaryWorkflow = 'configure-parameters-compute-formula-compare';
  } else if (detectedArchetype === 'scheduling-system') {
    primaryWorkflow = 'assess-confidence-interval-plan-track-completion';
  } else if (detectedArchetype === 'simulation') {
    primaryWorkflow = 'event-stream-trigger-state-update-milestone';
  } else if (detectedArchetype === 'tracker') {
    primaryWorkflow = 'incremental-logging-temporal-burn-audit';
  } else if (detectedArchetype === 'prediction-system') {
    primaryWorkflow = 'historical-trend-extrapolate-forecast-display';
  } else if (detectedArchetype === 'recommendation-engine') {
    primaryWorkflow = 'user-context-filtering-rank-advisory';
  } else if (detectedArchetype === 'data-transformation-tool') {
    primaryWorkflow = 'parse-structured-transform-export-data';
  } else if (detectedArchetype === 'accessibility-tool') {
    if (fullText.includes('speech') || fullText.includes('voice') || fullText.includes('audio') || fullText.includes('screen reader')) {
      primaryWorkflow = 'speech-audio-assistive-interface';
    } else if (fullText.includes('font') || fullText.includes('spacing') || fullText.includes('bionic') || fullText.includes('dyslexia') || fullText.includes('contrast')) {
      primaryWorkflow = 'visual-layout-text-adaptation';
    } else {
      primaryWorkflow = 'assistive-multimodal-translate-interface';
    }
  } else if (detectedArchetype === 'workflow-automation-system') {
    primaryWorkflow = 'multi-stage-pipeline-trigger-execution';
  } else if (detectedArchetype === 'resource-allocation-system') {
    primaryWorkflow = 'fair-share-capacity-queue-dispatch';
  }

  // 5. Technical Approach & Dataset Type
  const restLower = restriction.toLowerCase();
  const resLower = resource.toLowerCase();

  let technicalApproach = 'responsive-web-app';
  if (restLower.includes('client-side only') || restLower.includes('no backend') || restLower.includes('purely client side')) {
    technicalApproach = 'pure-client-side-zero-backend';
  } else if (restLower.includes('offline')) {
    technicalApproach = 'offline-first-pwa';
  } else if (restLower.includes('single web page') || restLower.includes('under 1 mb')) {
    technicalApproach = 'lightweight-static-web';
  }

  let datasetType = 'simulated-records';
  if (resLower.includes('csv')) datasetType = 'csv-tabular-feed';
  else if (resLower.includes('json')) datasetType = 'json-structured-dataset';
  else if (resLower.includes('api') || resLower.includes('browser-api')) datasetType = 'browser-or-rest-api';

  return {
    theme,
    subdomain: detectedSubdomain,
    solutionArchetype: detectedArchetype,
    userPersona: detectedPersona,
    primaryWorkflow,
    technicalApproach,
    datasetType,
    problemCategory: `${detectedSubdomain}:${detectedArchetype}`
  };
}

/**
 * Calculates weighted semantic diversity similarity between two challenges (0.0 to 1.0).
 *
 * Suggested model:
 * - Core problem statement similarity: 30%
 * - Functional workflow similarity: 25%
 * - Solution archetype similarity: 20%
 * - User persona similarity: 10%
 * - Technical approach similarity: 10%
 * - Resource similarity: 5%
 *
 * @param {Object} challengeA
 * @param {Object} challengeB
 * @param {number} rawProblemTextSimilarity - precomputed text similarity between problem statements
 * @param {number} rawResourceSimilarity - precomputed resource similarity
 * @returns {Object} Similarity breakdown and composite score
 */
export function computeWeightedDiversitySimilarity(challengeA, challengeB, rawProblemTextSimilarity = 0, rawResourceSimilarity = 0) {
  const profileA = challengeA.diversityProfile || extractDiversityProfile(challengeA);
  const profileB = challengeB.diversityProfile || extractDiversityProfile(challengeB);

  // Archetype match (1.0 if identical, 0.0 if different)
  const archetypeSim = profileA.solutionArchetype === profileB.solutionArchetype ? 1.0 : 0.0;

  // Workflow match (1.0 if identical, 0.0 if different)
  const workflowSim = profileA.primaryWorkflow === profileB.primaryWorkflow ? 1.0 : 0.0;

  // Persona match (1.0 if identical, 0.0 if different)
  // Persona match (1.0 if identical, 0.0 if different)
  const personaSim = profileA.userPersona === profileB.userPersona ? 1.0 : 0.0;

  // Technical approach match (1.0 if identical, 0.0 if different)
  const techSim = profileA.technicalApproach === profileB.technicalApproach ? 1.0 : 0.0;

  // Core problem similarity (30% weight in model):
  // Blends raw textual problem statement similarity with subdomain alignment.
  // If subdomains match, adds 0.15 alignment base while raw text provides the remaining dynamic range.
  // If subdomains differ, relies purely on text similarity.
  const sameSubdomain = profileA.subdomain === profileB.subdomain;
  const coreProblemSim = sameSubdomain
    ? Math.min(1.0, 0.15 + 0.85 * rawProblemTextSimilarity)
    : rawProblemTextSimilarity;

  // Weighted composition (30% problem, 25% workflow, 20% archetype, 10% persona, 10% tech, 5% resource)
  const compositeSimilarity =
    0.30 * coreProblemSim +
    0.25 * workflowSim +
    0.20 * archetypeSim +
    0.10 * personaSim +
    0.10 * techSim +
    0.05 * rawResourceSimilarity;

  return {
    compositeSimilarity: parseFloat(compositeSimilarity.toFixed(4)),
    breakdown: {
      coreProblemSim: parseFloat(coreProblemSim.toFixed(4)),
      workflowSim: parseFloat(workflowSim.toFixed(4)),
      archetypeSim: parseFloat(archetypeSim.toFixed(4)),
      personaSim: parseFloat(personaSim.toFixed(4)),
      techSim: parseFloat(techSim.toFixed(4)),
      resourceSim: parseFloat(rawResourceSimilarity.toFixed(4))
    },
    profileA,
    profileB
  };
}

export default {
  TRACKED_SOLUTION_ARCHETYPES,
  THEME_SUBDOMAINS,
  extractDiversityProfile,
  computeWeightedDiversitySimilarity
};
