/**
 * Challenge Diversity Profile & Taxonomy Service
 *
 * Implements deterministic classification, profile extraction, and
 * multi-dimensional weighted semantic diversity scoring across the 8 CTS themes.
 */

import { normalizeText } from './ingestionService.js';
import { tokenizeWords, computeTextSimilarity } from './noveltyService.js';

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
  // Single word requires word boundary with optional inflection (s, es, ies, ed, ing)
  const escaped = sig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let pattern = `\\b${escaped}(?:s|es|ed|ing)?\\b`;
  if (sig.endsWith('y')) {
    const root = sig.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pattern = `\\b(?:${escaped}(?:s|es|ed|ing)?|${root}ies)\\b`;
  }
  const regex = new RegExp(pattern, 'i');
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
    'filter out', 'phishing', 'malware', 'categorize', 'triage', 'auditor', 'anomaly alert'
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
    'itemize', 'parse', 'extract', 'bilingual', 'tax splitter', 'receipt itemizer', 'format converter', 'csv to json',
    'validator', 'validate', 'telemetry validator'
  ],
  'accessibility-tool': [
    'speech', 'screen reader', 'keyboard only', 'high contrast', 'wcag', 'voice dictation', 'motor impairment',
    'dyslexia', 'bionic reading', 'assistive', 'accessibility', 'font-scaling', 'color contrast', 'reader tool',
    'deaf', 'haptic', 'waveform', 'transcriber', 'pictogram', 'plain language'
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
  'financial-literacy': ['allowance', 'burn rate', 'budget', 'budgeting', 'student budget', 'financial education', 'money habit', 'budget tracker'],
  'taxation-compliance': ['tax', 'gst', 'receipt itemizer', 'tax slab', 'compliance', 'invoice tax'],
  'merchant-operations': ['shopkeeper', 'retailer', 'point of sale', 'pos', 'merchant', 'inventory sales'],
  'financial-inclusion': ['micro-savings', 'spare change', 'round-up', 'unbanked', 'informal savings'],
  'insurance': ['insurance', 'premium', 'claim', 'deductible', 'policy risk', 'coverage'],
  'risk-assessment': ['portfolio risk', 'asset allocation', 'volatility', 'concentration risk', 'credit score'],
  'financial-privacy': ['subscription audit', 'subscription', 'recurring debit', 'recurring payment', 'recurring charge', 'repeat charge', 'renewal', 'privacy-preserving', 'zero personal data', 'credential leak'],

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
  'inventory-allocation': ['inventory', 'stock', 'warehouse', 'backorder', 'reorder point', 'reorder threshold', 'stockout', 'shortage', 'stock depletion'],
  'customer-review-sentiment': ['sentiment', 'review analysis', 'customer feedback', 'star rating'],
  'order-fulfillment-logistics': ['dispatch order', 'delivery tracking', 'courier', 'fulfillment'],
  'dynamic-discounting': ['coupon', 'discount code', 'flash sale', 'surge pricing', 'b2b', 'wholesale', 'bulk quote', 'volume discount', 'moq'],
  'return-management': ['refund', 'return label', 'restocking', 'exchange policy'],
  'seller-analytics': ['seller dashboard', 'gross merchandise', 'payout schedule', 'merchant sales'],

  // Accessibility
  'screen-reader-enhancement': ['screen reader', 'aria', 'alt text', 'vocalize', 'read aloud', 'dom elements aloud'],
  'keyboard-navigation': ['keyboard only', 'zero mouse', 'tab and enter', 'keystroke', 'keyboard navigation', 'tab sequence'],
  'speech-assistive-tech': ['speech', 'voice dictation', 'speech-to-text', 'text-to-speech', 'speech recognition', 'voice command'],
  'visual-contrast-magnification': ['high contrast', 'color blind', 'font scaling', 'magnification', 'color contrast', 'bionic reading'],
  'cognitive-distraction-reduction': ['dyslexia', 'plain language', 'pictogram', 'simplified reading', 'reading level', 'cognitive'],
  'sensory-feedback': ['haptic', 'waveform', 'frequencies', 'frequency', 'auditory alert', 'deaf', 'soundscape', 'vibration', 'audio input'],
  'motor-impairment-adaptation': ['motor impairment', 'single switch', 'tremor', 'head tracker', 'dwell click'],
  'simplified-ui-interfaces': ['simplified layout', 'one-touch', 'minimal interface', 'accessible ui', 'icon library'],
  'closed-captioning': ['caption', 'subtitle', 'transcript', 'audio description'],
  'multimodal-input': ['multimodal', 'gesture', 'eye tracking', 'gaze']
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

export const TRACKED_ALGORITHMIC_APPROACHES = Object.freeze([
  'graph-optimization',
  'classification',
  'anomaly-detection',
  'time-series-forecasting',
  'constraint-satisfaction',
  'scheduling-optimization',
  'natural-language-processing',
  'image-processing',
  'geospatial-analysis',
  'recommendation-algorithms',
  'matching-algorithms',
  'simulation',
  'cryptographic-verification',
  'rule-based-reasoning',
  'resource-allocation',
  'data-transformation',
  'not_applicable'
]);

export const ALGORITHM_SIGNATURES = Object.freeze({
  'graph-optimization': [
    'settle up', 'minimize transactions', 'minimum number of transactions', 'debt simplification',
    'debt minimization', 'graph simplification', 'graph reducer', 'graph reduction', 'dijkstra',
    'shortest path', 'bipartite graph', 'network flow', 'minimum spanning tree', 'cycle detection',
    'graph-minimizing', 'settlement board'
  ],
  'anomaly-detection': [
    'anomaly', 'fraud', 'suspicious', 'micro-charge', 'outlier', 'burst transaction',
    'unauthorized transaction', 'z-score', 'standard deviation', 'unusual spike', 'threshold breach',
    'unauthorized debit', 'anomaly alert', 'transaction anomaly', 'reorder threshold', 'stockout', 'shortage', 'stock depletion'
  ],
  'classification': [
    'classify', 'classification', 'categorize', 'triage', 'rubric', 'grade distribution',
    'phishing', 'malware', 'severity level', 'sentiment analysis', 'filter out'
  ],
  'time-series-forecasting': [
    'forecast', 'burn rate projection', 'deficit forecast', 'trend extrapolation', 'moving average',
    'exponential smoothing', 'time series', 'predict future', 'future projection', 'projection'
  ],
  'constraint-satisfaction': [
    'knapsack', 'bin packing', 'constraint satisfaction', 'solver', 'backtracking',
    'feasible schedule', 'capacity constraint', 'hard constraint', 'conflict resolution'
  ],
  'scheduling-optimization': [
    'spaced repetition', 'leitner', 'forgetting curve', 'review interval', 'revision prioritizer',
    'calendar scheduling', 'timetable', 'study schedule', 'shift scheduling', 'deadline prioritization'
  ],
  'recommendation-algorithms': [
    'collaborative filtering', 'content-based filtering', 'recommend', 'recommendation',
    'personalized hint', 'decision tree guidance', 'rank advisory', 'suggested next'
  ],
  'matching-algorithms': [
    'bipartite matching', 'gale-shapley', 'stable marriage', 'matchmaking', 'mentor match',
    'barter matching', 'skill exchange', 'pair users', 'two-sided matching'
  ],
  'simulation': [
    'simulation', 'simulator', 'monte carlo', 'compound growth comparator', 'compound interest simulation',
    'round-up simulator', 'what-if scenario', 'synthetic stream', 'model compound'
  ],
  'cryptographic-verification': [
    'hash verification', 'sha-256', 'submission hash', 'digital signature', 'tamper detection',
    'audit trail hash', 'checksum', 'integrity check', 'cryptographic'
  ],
  'rule-based-reasoning': [
    'rule-based', 'tax slab', 'tax splitter', 'eligibility logic', 'tiered discount',
    'deductible calculation', 'multi-condition validation', 'policy engine', 'compliance check',
    'reorder point', 'reorder threshold', 'stock depletion', 'stockout', 'amortization', 'emi', 'compound interest'
  ],
  'resource-allocation': [
    'fair-share', 'quota', 'round-robin', 'load balance', 'capacity planning',
    'parking occupancy', 'seat allocator', 'relief essential balancer', 'queue dispatch'
  ],
  'natural-language-processing': [
    'speech synthesis', 'speech recognition', 'screen reader', 'bionic reading', 'dyslexia',
    'text summarizer', 'tokenization', 'voice dictation', 'note simplifier', 'readability index'
  ],
  'data-transformation': [
    'csv to json', 'receipt itemizer', 'format converter', 'parse structured', 'data extraction',
    'schema translation', 'tabular parser', 'itemize'
  ],
  'geospatial-analysis': [
    'haversine', 'proximity', 'geofence', 'kiosk locator', 'route alternative', 'gps coordinate',
    'walking route', 'station accessibility', 'nearest shelter', 'radius filter'
  ]
});

export const ENGINEERING_TASK_SIGNATURES = Object.freeze({
  'reconciliation-settlement': ['settle', 'settlement', 'reconciliation', 'debt', 'shared expense', 'split bill', 'balance clearing'],
  'stream-anomaly-monitoring': [
    'anomaly', 'anomalies', 'fraud', 'suspicious', 'micro-charge', 'flag', 'threat', 'anomaly alert',
    'repeat debit', 'recurring charge', 'repeat charge', 'subscription audit', 'renewal',
    'recurring debit', 'recurring payment', 'subscription alert', 'billing history',
    'reorder point', 'reorder threshold', 'stockout', 'stock alert', 'reorder alerts', 'depletion', 'stock depletion'
  ],
  'prioritized-scheduling': ['spaced repetition', 'leitner', 'schedule', 'timetable', 'review interval', 'calendar', 'prioritizer'],
  'formulaic-computation-projection': ['amortization', 'loan', 'interest formula', 'burn rate', 'calculator', 'tax slab', 'compound'],
  'multi-criteria-matching': ['matchmaking', 'mentor match', 'barter', 'skill exchange', 'peer review', 'pairing'],
  'rule-based-compliance-filtering': ['compliance', 'taxation', 'proctoring', 'cheat detection', 'honor code', 'audit', 'eligibility'],
  'spatial-proximity-routing': ['route', 'transit', 'evacuation', 'nearest', 'navigation', 'locator', 'commute'],
  'accessibility-interface-adaptation': [
    'screen reader', 'speech', 'contrast', 'dyslexia', 'bionic', 'motor impairment', 'keyboard only', 'assistive',
    'deaf', 'haptic', 'waveform', 'transcriber', 'pictogram', 'plain language'
  ],
  'structured-data-transformation': ['itemize', 'receipt', 'csv', 'converter', 'transform data', 'extract'],
  'capacity-dispatch-allocation': ['dispatch', 'quota', 'seat allocator', 'occupancy', 'food waste', 'shortage balancer'],
  'general-metric-visualization': ['dashboard', 'chart', 'kpi', 'metrics', 'visualizer', 'overview', 'summary']
});

export const INPUT_STRUCTURE_SIGNATURES = Object.freeze({
  'relational-graph': ['graph', 'network', 'edges', 'nodes', 'roommates', 'transactions between parties', 'debts', 'peer links'],
  'time-series-stream': ['time series', 'timestamps', 'stream', 'sensor readings', 'hourly', 'daily logs', 'price history'],
  'tabular-records': ['csv', 'table', 'records', 'transactions', 'dataset of common', 'items list', 'inventory', 'entries'],
  'hierarchical-tree': ['tree', 'prerequisite', 'syllabus', 'curriculum', 'decision tree', 'categories'],
  'unstructured-text': ['error messages', 'code snippets', 'notes', 'announcements', 'text content', 'psa', 'speech'],
  'form-parameters': ['parameters', 'loan amount', 'interest rate', 'tenure', 'budget input', 'sliders', 'criteria']
});

export const OUTPUT_STRUCTURE_SIGNATURES = Object.freeze({
  'simplified-graph-ledger': ['minimized transactions', 'settlement board', 'simplified debt', 'resolved balances', 'net balance'],
  'prioritized-alert-feed': ['alert', 'flagged transactions', 'anomaly notices', 'warning list', 'threat log', 'reorder alerts', 'stock depletion'],
  'optimized-schedule-calendar': ['timetable', 'study schedule', 'calendar', 'spaced intervals', 'timeline'],
  'comparative-projection-table': ['amortization table', 'growth comparison', 'projection chart', 'breakdown', 'forecast table'],
  'ranked-match-list': ['matched pairs', 'recommended tutors', 'volunteer assignments', 'rankings', 'top matches'],
  'filtered-eligibility-report': ['tax breakdown', 'receipt itemization', 'compliance report', 'audit trail'],
  'adapted-accessible-view': ['speech narration', 'high contrast view', 'simplified layout', 'accessible view', 'spoken metaphor'],
  'summary-kpi-dashboard': ['metrics dashboard', 'kpi summary', 'overview cards', 'status breakdown', 'visual charts']
});

export const DATA_STRATEGY_SIGNATURES = Object.freeze({
  'greedy-graph-reduction': ['minimum number of transactions', 'settle up', 'graph simplification', 'debt minimization'],
  'windowed-threshold-filtering': ['anomaly', 'threshold', 'moving average', 'micro-charge', 'sliding window'],
  'spaced-interval-decay': ['spaced repetition', 'leitner', 'forgetting curve', 'decay'],
  'recursive-amortization': ['amortization', 'compound interest', 'periodic payment', 'monthly installment'],
  'bipartite-ranking': ['matching', 'pairing', 'bipartite', 'two-sided'],
  'conditional-rule-evaluation': ['rule-based', 'tax slab', 'multi-step audit', 'conditional logic'],
  'distance-radius-filtering': ['haversine', 'proximity', 'geofence', 'nearest', 'radius'],
  'lexical-dom-transformation': ['font', 'contrast', 'speech', 'text transform', 'reading'],
  'aggregation-group-by': ['aggregate', 'sum', 'group by', 'average', 'summary metrics']
});

export const DEFAULT_FUNCTIONAL_EQUIVALENCE_WEIGHTS = Object.freeze({
  CORE_PROBLEM_OUTCOME: 0.25,
  ENGINEERING_TASK: 0.20,
  PRIMARY_WORKFLOW: 0.15,
  CORE_ALGORITHM: 0.15,
  INPUT_OUTPUT_STRUCTURE: 0.10,
  TECHNICAL_APPROACH: 0.10,
  PARTICIPANT_DELIVERABLE: 0.05
});

/**
 * Validates that functional equivalence weights are non-negative and sum to 1.0.
 */
export function validateFunctionalEquivalenceWeights(weights) {
  if (!weights || typeof weights !== 'object') {
    throw new Error('Functional equivalence weights must be a non-null object.');
  }
  const expectedKeys = [
    'CORE_PROBLEM_OUTCOME',
    'ENGINEERING_TASK',
    'PRIMARY_WORKFLOW',
    'CORE_ALGORITHM',
    'INPUT_OUTPUT_STRUCTURE',
    'TECHNICAL_APPROACH',
    'PARTICIPANT_DELIVERABLE'
  ];
  for (const k of expectedKeys) {
    if (typeof weights[k] !== 'number' || weights[k] < 0) {
      throw new Error(`Weight '${k}' must be a non-negative number.`);
    }
  }
  const sum = expectedKeys.reduce((acc, k) => acc + weights[k], 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(`Functional equivalence weights must sum to 1.0 (got ${sum.toFixed(4)}).`);
  }
  return true;
}

/**
 * Extracts a complete Challenge Diversity Profile from any challenge record or candidate.
 *
 * @param {Object} challenge
 * @returns {Object} Extracted diversity profile
 */
export function extractDiversityProfile(challenge = {}) {
  const c = challenge || {};
  const theme = c.theme || c.domain || 'Open Innovation';
  const title = c.title || c.problem?.title || '';
  const problemStmt = c.problemStatement || c.problem?.statement || '';
  const deliverable = c.deliverable || '';
  const restriction = Array.isArray(c.restrictions)
    ? c.restrictions.join(' ')
    : `${c.restriction?.name || ''} ${c.restriction?.rule || ''}`.trim() || (typeof c.restriction === 'string' ? c.restriction : '');
  const resource = Array.isArray(c.resourcesProvided)
    ? c.resourcesProvided.join(' ')
    : `${c.resource?.name || ''} ${c.resource?.guidance || ''}`.trim() || (typeof c.resource === 'string' ? c.resource : '');

  const fullText = `${title} ${problemStmt} ${deliverable} ${restriction} ${resource}`.toLowerCase();
  const titleLower = title.toLowerCase();
  const deliverableLower = deliverable.toLowerCase();

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
        if (matchesSignal(titleLower, sig)) {
          score += sig.length * 2;
        }
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
        if (matchesSignal(titleLower, sig)) {
          score += sig.length * 2;
        }
        if (matchesSignal(deliverableLower, sig)) {
          score += sig.length;
        }
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
        if (matchesSignal(titleLower, sig)) {
          score += sig.length * 2;
        }
      }
    }
    if (score > bestPersonaScore) {
      bestPersonaScore = score;
      detectedPersona = persona;
    }
  }

  // 4. Determine Main Engineering Task (Phase 13)
  let detectedEngineeringTask = 'general-metric-visualization';
  let bestTaskScore = 0;
  let bestSpecializedTask = null;
  let bestSpecializedScore = 0;

  for (const [task, signals] of Object.entries(ENGINEERING_TASK_SIGNATURES)) {
    let score = 0;
    for (const sig of signals) {
      if (matchesSignal(fullText, sig)) {
        score += sig.length;
        if (matchesSignal(titleLower, sig)) {
          score += sig.length * 2;
        }
        if (matchesSignal(deliverableLower, sig)) {
          score += sig.length;
        }
      }
    }
    if (score > bestTaskScore) {
      bestTaskScore = score;
      detectedEngineeringTask = task;
    }
    if (task !== 'general-metric-visualization' && score > bestSpecializedScore) {
      bestSpecializedScore = score;
      bestSpecializedTask = task;
    }
  }

  // If a specialized engineering task is present with meaningful signal, prefer it over generic dashboard visualization
  if (detectedEngineeringTask === 'general-metric-visualization' && bestSpecializedScore >= 15 && bestSpecializedTask) {
    detectedEngineeringTask = bestSpecializedTask;
  }

  if (bestTaskScore === 0) {
    if (detectedArchetype === 'optimization-engine') detectedEngineeringTask = 'reconciliation-settlement';
    else if (detectedArchetype === 'classification-system') detectedEngineeringTask = 'stream-anomaly-monitoring';
    else if (detectedArchetype === 'calculator') detectedEngineeringTask = 'formulaic-computation-projection';
    else if (detectedArchetype === 'scheduling-system') detectedEngineeringTask = 'prioritized-scheduling';
    else if (detectedArchetype === 'matching-system') detectedEngineeringTask = 'multi-criteria-matching';
    else if (detectedArchetype === 'accessibility-tool') detectedEngineeringTask = 'accessibility-interface-adaptation';
    else if (detectedArchetype === 'data-transformation-tool') detectedEngineeringTask = 'structured-data-transformation';
    else if (detectedArchetype === 'resource-allocation-system') detectedEngineeringTask = 'capacity-dispatch-allocation';
    else detectedEngineeringTask = 'general-metric-visualization';
  }

  // 5. Derive Primary Workflow (coupled to engineering task and archetype)
  let primaryWorkflow = 'aggregate-metrics-visualize-kpis';
  if (detectedEngineeringTask === 'reconciliation-settlement' || detectedArchetype === 'optimization-engine') {
    primaryWorkflow = 'import-records-simplify-graph-export';
  } else if (detectedEngineeringTask === 'stream-anomaly-monitoring' || detectedArchetype === 'classification-system') {
    primaryWorkflow = 'stream-ingest-evaluate-rules-alert';
  } else if (detectedEngineeringTask === 'multi-criteria-matching' || detectedArchetype === 'matching-system' || detectedArchetype === 'marketplace') {
    primaryWorkflow = 'profile-creation-matchmaking-transaction-ledger';
  } else if (detectedEngineeringTask === 'formulaic-computation-projection' || detectedArchetype === 'calculator') {
    primaryWorkflow = 'configure-parameters-compute-formula-compare';
  } else if (detectedEngineeringTask === 'prioritized-scheduling' || detectedArchetype === 'scheduling-system') {
    primaryWorkflow = 'assess-confidence-interval-plan-track-completion';
  } else if (detectedArchetype === 'simulation') {
    primaryWorkflow = 'event-stream-trigger-state-update-milestone';
  } else if (detectedArchetype === 'tracker') {
    primaryWorkflow = 'incremental-logging-temporal-burn-audit';
  } else if (detectedArchetype === 'prediction-system') {
    primaryWorkflow = 'historical-trend-extrapolate-forecast-display';
  } else if (detectedArchetype === 'recommendation-engine') {
    primaryWorkflow = 'user-context-filtering-rank-advisory';
  } else if (detectedEngineeringTask === 'structured-data-transformation' || detectedArchetype === 'data-transformation-tool') {
    primaryWorkflow = 'parse-structured-transform-export-data';
  } else if (detectedEngineeringTask === 'accessibility-interface-adaptation' || detectedArchetype === 'accessibility-tool') {
    if (fullText.includes('speech') || fullText.includes('voice') || fullText.includes('audio') || fullText.includes('screen reader')) {
      primaryWorkflow = 'speech-audio-assistive-interface';
    } else if (fullText.includes('font') || fullText.includes('spacing') || fullText.includes('bionic') || fullText.includes('dyslexia') || fullText.includes('contrast')) {
      primaryWorkflow = 'visual-layout-text-adaptation';
    } else {
      primaryWorkflow = 'assistive-multimodal-translate-interface';
    }
  } else if (detectedEngineeringTask === 'capacity-dispatch-allocation' || detectedArchetype === 'resource-allocation-system') {
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

  // 6. PHASE 13: Core Algorithm / Computational Technique
  let detectedAlgorithm = 'not_applicable';
  let bestAlgorithmScore = 0;
  for (const [algo, signals] of Object.entries(ALGORITHM_SIGNATURES)) {
    let score = 0;
    for (const sig of signals) {
      if (matchesSignal(fullText, sig)) {
        score += sig.length;
        if (matchesSignal(titleLower, sig)) {
          score += sig.length * 2;
        }
        if (matchesSignal(deliverableLower, sig)) {
          score += sig.length;
        }
      }
    }
    if (score > bestAlgorithmScore) {
      bestAlgorithmScore = score;
      detectedAlgorithm = algo;
    }
  }
  if (bestAlgorithmScore === 0) {
    // Sensible defaults based on engineeringTask and archetype if no specific signals
    if (detectedEngineeringTask === 'stream-anomaly-monitoring') detectedAlgorithm = 'anomaly-detection';
    else if (detectedEngineeringTask === 'rule-based-compliance-filtering') detectedAlgorithm = 'rule-based-reasoning';
    else if (detectedEngineeringTask === 'prioritized-scheduling') detectedAlgorithm = 'scheduling-optimization';
    else if (detectedEngineeringTask === 'capacity-dispatch-allocation') detectedAlgorithm = 'resource-allocation';
    else if (detectedEngineeringTask === 'multi-criteria-matching') detectedAlgorithm = 'matching-algorithms';
    else if (detectedArchetype === 'optimization-engine') detectedAlgorithm = 'graph-optimization';
    else if (detectedArchetype === 'classification-system') detectedAlgorithm = 'classification';
    else if (detectedArchetype === 'scheduling-system') detectedAlgorithm = 'scheduling-optimization';
    else if (detectedArchetype === 'prediction-system') detectedAlgorithm = 'time-series-forecasting';
    else if (detectedArchetype === 'simulation') detectedAlgorithm = 'simulation';
    else if (detectedArchetype === 'matching-system') detectedAlgorithm = 'matching-algorithms';
    else if (detectedArchetype === 'recommendation-engine') detectedAlgorithm = 'recommendation-algorithms';
    else if (detectedArchetype === 'data-transformation-tool') detectedAlgorithm = 'data-transformation';
    else detectedAlgorithm = 'not_applicable';
  }

  // 8. PHASE 13: Input Data Structure
  let detectedInputStructure = 'tabular-records';
  let bestInputScore = 0;
  for (const [inStruct, signals] of Object.entries(INPUT_STRUCTURE_SIGNATURES)) {
    let score = 0;
    for (const sig of signals) {
      if (matchesSignal(fullText, sig)) {
        score += sig.length;
      }
    }
    if (score > bestInputScore) {
      bestInputScore = score;
      detectedInputStructure = inStruct;
    }
  }

  // 9. PHASE 13: Expected Output Structure
  let detectedOutputStructure = 'summary-kpi-dashboard';
  let bestOutputScore = 0;
  for (const [outStruct, signals] of Object.entries(OUTPUT_STRUCTURE_SIGNATURES)) {
    let score = 0;
    for (const sig of signals) {
      if (matchesSignal(fullText, sig)) {
        score += sig.length;
      }
    }
    if (score > bestOutputScore) {
      bestOutputScore = score;
      detectedOutputStructure = outStruct;
    }
  }
  if (bestOutputScore === 0) {
    if (detectedEngineeringTask === 'reconciliation-settlement') detectedOutputStructure = 'simplified-graph-ledger';
    else if (detectedEngineeringTask === 'stream-anomaly-monitoring') detectedOutputStructure = 'prioritized-alert-feed';
    else if (detectedEngineeringTask === 'prioritized-scheduling') detectedOutputStructure = 'optimized-schedule-calendar';
    else if (detectedEngineeringTask === 'formulaic-computation-projection') detectedOutputStructure = 'comparative-projection-table';
    else if (detectedEngineeringTask === 'multi-criteria-matching') detectedOutputStructure = 'ranked-match-list';
    else if (detectedEngineeringTask === 'accessibility-interface-adaptation') detectedOutputStructure = 'adapted-accessible-view';
    else if (detectedEngineeringTask === 'structured-data-transformation') detectedOutputStructure = 'filtered-eligibility-report';
    else detectedOutputStructure = 'summary-kpi-dashboard';
  }

  // 10. PHASE 13: Data Processing Strategy
  let detectedDataStrategy = 'aggregation-group-by';
  let bestStrategyScore = 0;
  for (const [strat, signals] of Object.entries(DATA_STRATEGY_SIGNATURES)) {
    let score = 0;
    for (const sig of signals) {
      if (matchesSignal(fullText, sig)) {
        score += sig.length;
      }
    }
    if (score > bestStrategyScore) {
      bestStrategyScore = score;
      detectedDataStrategy = strat;
    }
  }

  // 11. PHASE 13: Technical Constraints
  let technicalConstraints = 'responsive-web-app';
  if (technicalApproach === 'pure-client-side-zero-backend') technicalConstraints = 'pure-client-side';
  else if (technicalApproach === 'offline-first-pwa') technicalConstraints = 'offline-first-storage';
  else if (technicalApproach === 'lightweight-static-web') technicalConstraints = 'single-page-static';

  // 12. PHASE 13: Deliverable Type
  let deliverableType = 'analytical-dashboard';
  if (detectedEngineeringTask === 'reconciliation-settlement') deliverableType = 'reconciliation-engine';
  else if (detectedEngineeringTask === 'stream-anomaly-monitoring') deliverableType = 'anomaly-monitor';
  else if (detectedEngineeringTask === 'formulaic-computation-projection') {
    deliverableType = theme === 'FinTech' ? 'financial-calculator' : 'domain-calculator';
  }
  else if (detectedEngineeringTask === 'prioritized-scheduling') deliverableType = 'interactive-scheduler';
  else if (detectedEngineeringTask === 'accessibility-interface-adaptation') deliverableType = 'assistive-tool';
  else if (detectedEngineeringTask === 'multi-criteria-matching') deliverableType = 'matching-platform';
  else if (detectedEngineeringTask === 'structured-data-transformation') deliverableType = 'transformation-utility';
  else if (detectedEngineeringTask === 'capacity-dispatch-allocation') deliverableType = 'allocation-dispatcher';

  return {
    theme,
    subdomain: detectedSubdomain,
    solutionArchetype: detectedArchetype,
    userPersona: detectedPersona,
    primaryWorkflow,
    technicalApproach,
    datasetType,
    problemCategory: `${detectedSubdomain}:${detectedArchetype}`,
    // Phase 13 extensions
    coreAlgorithm: detectedAlgorithm,
    engineeringTask: detectedEngineeringTask,
    inputStructure: detectedInputStructure,
    outputStructure: detectedOutputStructure,
    dataProcessingStrategy: detectedDataStrategy,
    technicalConstraints,
    deliverableType
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

/**
 * Phase 13: Computes dedicated Functional Equivalence Score between two challenges (0.0 to 1.0).
 *
 * Evaluates whether participants would build essentially the same application or system,
 * regardless of surface labels, domain names, or wording.
 *
 * Dimension weights:
 * - Core problem and intended outcome: 25%
 * - Main engineering task: 20%
 * - Primary workflow: 15%
 * - Core algorithm: 15%
 * - Input/output structure: 10%
 * - Technical approach: 10%
 * - Participant deliverable: 5%
 *
 * @param {Object} challengeA
 * @param {Object} challengeB
 * @param {number} [rawProblemTextSimilarity=0]
 * @param {number} [rawDeliverableTextSimilarity=0]
 * @param {Object} [customWeights=null]
 * @returns {Object} Functional equivalence evaluation result
 */
export function computeFunctionalEquivalence(
  challengeA,
  challengeB,
  rawProblemTextSimilarity = 0,
  rawDeliverableTextSimilarity = 0,
  customWeights = null
) {
  const weights = customWeights || DEFAULT_FUNCTIONAL_EQUIVALENCE_WEIGHTS;
  validateFunctionalEquivalenceWeights(weights);

  const profileA = challengeA.diversityProfile || extractDiversityProfile(challengeA);
  const profileB = challengeB.diversityProfile || extractDiversityProfile(challengeB);

  // Derive dynamic problem and deliverable text similarity if not supplied by caller
  let effectiveProblemSim = rawProblemTextSimilarity;
  if (!effectiveProblemSim || effectiveProblemSim <= 0) {
    const textA = challengeA.problem?.statement || challengeA.problemStatement || challengeA.statement || '';
    const textB = challengeB.problem?.statement || challengeB.problemStatement || challengeB.statement || '';
    if (textA && textB) {
      effectiveProblemSim = computeTextSimilarity(textA, textB);
    }
  }

  let effectiveDeliverableSim = rawDeliverableTextSimilarity;
  if (!effectiveDeliverableSim || effectiveDeliverableSim <= 0) {
    const delivA = challengeA.deliverable || '';
    const delivB = challengeB.deliverable || '';
    if (delivA && delivB) {
      effectiveDeliverableSim = computeTextSimilarity(delivA, delivB);
    }
  }

  // 1. Core Problem and Intended Outcome (25%)
  const sameSubdomain = profileA.subdomain === profileB.subdomain;
  const samePersona = profileA.userPersona === profileB.userPersona;
  const coreProblemSim = sameSubdomain
    ? Math.min(1.0, (samePersona ? 0.35 : 0.20) + 0.75 * effectiveProblemSim)
    : effectiveProblemSim * 0.85;

  // 2. Main Engineering Task (20%)
  let taskSim = 0.0;
  if (profileA.engineeringTask && profileB.engineeringTask) {
    if (profileA.engineeringTask === profileB.engineeringTask) {
      taskSim = 1.0;
    } else {
      // Related task affinities
      const taskGroups = [
        ['reconciliation-settlement', 'formulaic-computation-projection'],
        ['stream-anomaly-monitoring', 'rule-based-compliance-filtering'],
        ['prioritized-scheduling', 'capacity-dispatch-allocation'],
        ['structured-data-transformation', 'general-metric-visualization']
      ];
      for (const group of taskGroups) {
        if (group.includes(profileA.engineeringTask) && group.includes(profileB.engineeringTask)) {
          taskSim = 0.35;
          break;
        }
      }
    }
  }

  // 3. Primary Workflow (15%)
  const workflowSim = profileA.primaryWorkflow === profileB.primaryWorkflow ? 1.0 : 0.0;

  // 4. Core Algorithm (15%)
  let algoSim = 0.0;
  const a1 = profileA.coreAlgorithm;
  const a2 = profileB.coreAlgorithm;
  const isNoAlgoA = !a1 || a1 === 'not_applicable' || a1 === 'unknown';
  const isNoAlgoB = !a2 || a2 === 'not_applicable' || a2 === 'unknown';

  if (!isNoAlgoA && !isNoAlgoB) {
    if (a1 === a2) {
      algoSim = 1.0;
    } else {
      // Compatible algorithmic families
      const algoFamilies = [
        ['anomaly-detection', 'classification', 'rule-based-reasoning'],
        ['graph-optimization', 'constraint-satisfaction', 'matching-algorithms'],
        ['scheduling-optimization', 'constraint-satisfaction', 'resource-allocation'],
        ['time-series-forecasting', 'simulation'],
        ['rule-based-reasoning', 'classification']
      ];
      for (const fam of algoFamilies) {
        if (fam.includes(a1) && fam.includes(a2)) {
          algoSim = 0.50;
          break;
        }
      }
    }
  } else if (isNoAlgoA && isNoAlgoB) {
    algoSim = sameSubdomain ? (profileA.engineeringTask === profileB.engineeringTask ? 0.60 : 0.40) : 0.0;
  } else {
    algoSim = 0.0;
  }

  // 5. Input and Output Structure (10%)
  let inputSim = 0.0;
  if (profileA.inputStructure === profileB.inputStructure) {
    inputSim = 1.0;
  } else {
    const compatibleInputs = [
      ['tabular-records', 'time-series-stream'],
      ['tabular-records', 'form-parameters']
    ];
    for (const pair of compatibleInputs) {
      if (pair.includes(profileA.inputStructure) && pair.includes(profileB.inputStructure)) {
        inputSim = 0.50;
        break;
      }
    }
  }
  let outputSim = 0.0;
  if (profileA.outputStructure === profileB.outputStructure) {
    outputSim = 1.0;
  } else {
    const compatibleOutputs = [
      ['summary-kpi-dashboard', 'comparative-projection-table'],
      ['prioritized-alert-feed', 'summary-kpi-dashboard'],
      ['ranked-match-list', 'summary-kpi-dashboard']
    ];
    for (const pair of compatibleOutputs) {
      if (pair.includes(profileA.outputStructure) && pair.includes(profileB.outputStructure)) {
        outputSim = 0.50;
        break;
      }
    }
  }
  const ioSim = 0.5 * inputSim + 0.5 * outputSim;

  // 6. Technical Approach and Constraints (10%)
  let techSim = 0.0;
  if (profileA.technicalApproach === profileB.technicalApproach) {
    techSim = 1.0;
  } else {
    const webApproaches = ['responsive-web-app', 'offline-first-pwa', 'client-side-spa'];
    if (webApproaches.includes(profileA.technicalApproach) && webApproaches.includes(profileB.technicalApproach)) {
      techSim = 0.60;
    }
  }

  let constraintSim = 0.0;
  if (profileA.technicalConstraints === profileB.technicalConstraints) {
    constraintSim = 1.0;
  } else {
    const clientSideConstraints = ['responsive-web-app', 'offline-first-storage', 'client-side-only'];
    if (clientSideConstraints.includes(profileA.technicalConstraints) && clientSideConstraints.includes(profileB.technicalConstraints)) {
      constraintSim = 0.60;
    }
  }
  const techApproachSim = 0.6 * techSim + 0.4 * constraintSim;

  // 7. Participant Deliverable (5%)
  const deliverableTypeSim = profileA.deliverableType === profileB.deliverableType ? 1.0 : 0.0;
  const deliverableSim = 0.5 * deliverableTypeSim + 0.5 * effectiveDeliverableSim;

  // Composite Functional Equivalence Score
  const functionalEquivalenceScore =
    weights.CORE_PROBLEM_OUTCOME * coreProblemSim +
    weights.ENGINEERING_TASK * taskSim +
    weights.PRIMARY_WORKFLOW * workflowSim +
    weights.CORE_ALGORITHM * algoSim +
    weights.INPUT_OUTPUT_STRUCTURE * ioSim +
    weights.TECHNICAL_APPROACH * techApproachSim +
    weights.PARTICIPANT_DELIVERABLE * deliverableSim;

  return {
    functionalEquivalenceScore: parseFloat(functionalEquivalenceScore.toFixed(4)),
    breakdown: {
      coreProblemSim: parseFloat(coreProblemSim.toFixed(4)),
      engineeringTaskSim: parseFloat(taskSim.toFixed(4)),
      workflowSim: parseFloat(workflowSim.toFixed(4)),
      coreAlgorithmSim: parseFloat(algoSim.toFixed(4)),
      inputOutputSim: parseFloat(ioSim.toFixed(4)),
      techApproachSim: parseFloat(techApproachSim.toFixed(4)),
      deliverableSim: parseFloat(deliverableSim.toFixed(4))
    },
    profileA,
    profileB
  };
}

export default {
  TRACKED_SOLUTION_ARCHETYPES,
  TRACKED_ALGORITHMIC_APPROACHES,
  THEME_SUBDOMAINS,
  ALGORITHM_SIGNATURES,
  ENGINEERING_TASK_SIGNATURES,
  DEFAULT_FUNCTIONAL_EQUIVALENCE_WEIGHTS,
  validateFunctionalEquivalenceWeights,
  extractDiversityProfile,
  computeWeightedDiversitySimilarity,
  computeFunctionalEquivalence
};
