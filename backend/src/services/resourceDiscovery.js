import { verifyResource } from './resourceVerifier.js';
import ResourceCatalog from '../models/ResourceCatalog.js';

/**
 * Base abstract class for online resource discovery providers.
 */
export class ResourceDiscoveryProvider {
  constructor(name) {
    this.name = name;
  }

  async isAvailable() {
    return false;
  }

  async search({ query, domain, capability }) { // eslint-disable-line no-unused-vars
    throw new Error('search() must be implemented by subclass');
  }
}

/**
 * Authoritative Curated Provider providing vetted, high-reputation open sources
 * for public hackathons (data.gov.in, OpenStreetMap, arXiv, W3C WAI, etc.).
 */
export class CuratedAuthorityProvider extends ResourceDiscoveryProvider {
  constructor() {
    super('CuratedAuthorityProvider');
    this.catalog = [
      {
        name: 'OpenStreetMap with Leaflet.js',
        canonicalUrl: 'https://leafletjs.com/reference.html',
        domains: ['Smart Cities', 'Open Innovation', 'Accessibility'],
        capabilities: ['maps', 'geospatial', 'routing', 'tile-rendering'],
        resourceType: 'open-source-library',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'BSD-2-Clause / ODbL',
        description: 'Open-source JavaScript library for mobile-friendly interactive maps using free OpenStreetMap tiles.'
      },
      {
        name: 'arXiv Academic Paper API',
        canonicalUrl: 'https://info.arxiv.org/help/api/index.html',
        domains: ['EdTech'],
        capabilities: ['academic-search', 'paper-summarization', 'literature-review'],
        resourceType: 'public-api',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'Open Access',
        description: 'Official API for searching over 2 million open-access scholarly articles in STEM fields.'
      },
      {
        name: 'W3C Web Accessibility Initiative (WAI)',
        canonicalUrl: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
        domains: ['Accessibility'],
        capabilities: ['wcag', 'aria', 'screen-reader', 'contrast'],
        resourceType: 'documentation',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'W3C Software and Document Notice',
        description: 'International standards for web accessibility compliance, keyboard navigation, and ARIA attributes.'
      },
      {
        name: 'axe-core Accessibility Engine',
        canonicalUrl: 'https://github.com/dequelabs/axe-core',
        domains: ['Accessibility', 'EdTech'],
        capabilities: ['a11y-auditing', 'contrast-checking', 'dom-inspection'],
        resourceType: 'open-source-library',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'MPL-2.0',
        description: 'Open-source automated accessibility testing engine for HTML and JavaScript web applications.'
      },
      {
        name: 'Open Government Data (OGD) Platform India',
        canonicalUrl: 'https://www.data.gov.in/',
        domains: ['Smart Cities', 'FinTech', 'Open Innovation'],
        capabilities: ['civic-data', 'demographics', 'public-transit', 'welfare-schemes'],
        resourceType: 'public-api',
        pricingStatus: 'free',
        apiKeyRequired: true,
        registrationRequired: true,
        license: 'National Data Sharing and Accessibility Policy (NDSAP)',
        description: 'National portal providing open access to datasets published by Government of India departments.'
      },
      {
        name: 'USDA FoodData Central API',
        canonicalUrl: 'https://fdc.nal.usda.gov/api-guide.html',
        domains: ['HealthTech'],
        capabilities: ['nutrition-facts', 'dietary-analysis', 'food-composition'],
        resourceType: 'public-api',
        pricingStatus: 'free',
        apiKeyRequired: true,
        registrationRequired: false,
        license: 'Public Domain',
        description: 'Authoritative database of food components and nutrient profiles for nutritional and dietary applications.'
      },
      {
        name: 'Web Speech API (Browser Built-In)',
        canonicalUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API',
        domains: ['EdTech', 'Accessibility', 'Open Innovation'],
        capabilities: ['voice-recognition', 'speech-synthesis', 'dictation'],
        resourceType: 'browser-api',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'Web Standard',
        description: 'Native browser interface for speech recognition and text-to-speech without external API keys.'
      },
      {
        name: 'Web Audio API (Browser Built-In)',
        canonicalUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API',
        domains: ['EdTech', 'Accessibility'],
        capabilities: ['audio-processing', 'frequency-analysis', 'waveform-synthesis'],
        resourceType: 'browser-api',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'Web Standard',
        description: 'High-level JavaScript API for processing and synthesizing audio in web applications.'
      },
      {
        name: 'Frankfurter Currency API',
        canonicalUrl: 'https://api.frankfurter.dev/v1/',
        domains: ['E-commerce', 'Open Innovation', 'FinTech'],
        capabilities: ['currency-conversion', 'exchange-rates', 'time-series', 'trend-analysis'],
        resourceType: 'public-api',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'Open Source / MIT',
        description: 'Open-source currency conversion and historical exchange rate API published by the European Central Bank.'
      },
      {
        name: 'DummyJSON E-Commerce & Products API',
        canonicalUrl: 'https://dummyjson.com/docs/products',
        domains: ['E-commerce'],
        capabilities: ['product-catalog', 'mock-inventory', 'promotional-pricing', 'user-carts', 'reviews'],
        resourceType: 'public-api',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'MIT',
        description: 'Free REST API providing simulated ecommerce product, cart, review, and user datasets for prototyping.'
      },
      {
        name: 'Open Food Facts Database API',
        canonicalUrl: 'https://world.openfoodfacts.org/data',
        domains: ['HealthTech', 'E-commerce'],
        capabilities: ['allergen-detection', 'ingredients-text', 'eco-score', 'food-products'],
        resourceType: 'public-api',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'Open Database License (ODbL)',
        description: 'Collaborative, free and open database of food products with ingredients, allergens tags, and eco-scores.'
      },
      {
        name: 'openFDA National Drug Code (NDC) Directory API',
        canonicalUrl: 'https://open.fda.gov/apis/drug/ndc/',
        domains: ['HealthTech'],
        capabilities: ['drug-names', 'ndc-directory', 'dosage-forms', 'expiration-dates'],
        resourceType: 'public-api',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'Public Domain / CC0',
        description: 'Official openFDA National Drug Code Directory API for drug product names, dosage forms, and listing dates.'
      },
      {
        name: 'Open-Meteo Weather Forecast API',
        canonicalUrl: 'https://open-meteo.com/en/docs',
        domains: ['HealthTech', 'Sustainability', 'Smart Cities'],
        capabilities: ['temperature', 'humidity', 'uv-index', 'hourly-forecast', 'heat-stress'],
        resourceType: 'public-api',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'Non-Commercial Open Data / CC BY 4.0',
        description: 'Open-source weather API providing high-resolution hourly temperature, humidity, UV index, and weather forecasts.'
      },
      {
        name: 'RandomUser Simulation API',
        canonicalUrl: 'https://randomuser.me/documentation',
        domains: ['HealthTech'],
        capabilities: ['patient-roster', 'mock-users', 'contact-profiles', 'queue-tokens'],
        resourceType: 'public-api',
        pricingStatus: 'free',
        apiKeyRequired: false,
        registrationRequired: false,
        license: 'MIT',
        description: 'Free, open-source API for generating random user profile data for test rosters and simulated clinic queues.'
      }
    ];
  }

  async isAvailable() {
    return true;
  }

  async search({ query = '', domain = '', capability = '' }) {
    const qLower = query.toLowerCase();
    const dLower = domain.toLowerCase();
    const cLower = capability.toLowerCase();

    return this.catalog.filter((item) => {
      const matchDomain = !domain || item.domains.some((d) => d.toLowerCase() === dLower);
      const matchCap = !capability || item.capabilities.some((c) => c.toLowerCase().includes(cLower));
      const matchQuery = !query ||
        item.name.toLowerCase().includes(qLower) ||
        item.description.toLowerCase().includes(qLower) ||
        item.capabilities.some((c) => c.toLowerCase().includes(qLower));

      return matchDomain && (matchCap || matchQuery);
    });
  }
}

/**
 * Mock / Custom Discovery Provider for automated testing and future external search APIs.
 */
export class ExternalSearchProvider extends ResourceDiscoveryProvider {
  constructor(options = {}) {
    super('ExternalSearchProvider');
    this.configured = Boolean(options.apiKey);
  }

  async isAvailable() {
    return this.configured;
  }

  async search({ query, domain, capability }) { // eslint-disable-line no-unused-vars
    if (!this.configured) {
      return {
        status: 'discovery_limited',
        reason: 'Live external web search provider is unconfigured or offline.',
        results: []
      };
    }
    return { status: 'ok', results: [] };
  }
}

/**
 * Resource Discovery Orchestrator
 */
export class ResourceDiscoveryService {
  constructor(providers = [new CuratedAuthorityProvider()]) {
    this.providers = providers;
  }

  /**
   * Discovers candidate resources matching query, domain, and technical capability.
   */
  async discoverCandidates({ query = '', domain = '', capability = '', verifyImmediately = false, verifierOptions = {} }) {
    const allCandidates = [];

    for (const provider of this.providers) {
      const available = await provider.isAvailable();
      if (!available) {
        continue;
      }

      try {
        const results = await provider.search({ query, domain, capability });
        if (Array.isArray(results)) {
          allCandidates.push(...results);
        } else if (results && Array.isArray(results.results)) {
          allCandidates.push(...results.results);
        }
      } catch (err) {
        console.warn(`[ResourceDiscovery] Provider ${provider.name} failed: ${err.message}`);
      }
    }

    // Deduplicate by canonicalUrl or name
    const seen = new Set();
    const deduplicated = [];
    for (const c of allCandidates) {
      const key = (c.canonicalUrl || c.name || '').trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(c);
      }
    }

    if (!verifyImmediately) {
      return deduplicated.map((d) => ({
        ...d,
        verificationStatus: 'candidate'
      }));
    }

    // Verify candidates concurrently with verifier
    const verifiedResults = await Promise.all(
      deduplicated.map(async (candidate) => {
        const report = await verifyResource(candidate, verifierOptions);
        return {
          ...candidate,
          verificationStatus: report.verificationStatus,
          verificationEvidence: report.verificationEvidence,
          lastVerifiedAt: report.lastVerifiedAt
        };
      })
    );

    return verifiedResults;
  }

  /**
   * Seeds verified or candidate authoritative resources into ResourceCatalog.
   */
  async seedAuthorityCatalog() {
    const candidates = await this.discoverCandidates({ verifyImmediately: false });
    let seeded = 0;

    for (const c of candidates) {
      const existing = await ResourceCatalog.findOne({ name: c.name });
      if (!existing) {
        await ResourceCatalog.create({
          ...c,
          sourceProvenance: 'curated_catalog',
          verificationStatus: 'candidate' // Candidate until live verification
        });
        seeded++;
      }
    }
    return { totalCandidates: candidates.length, newlySeeded: seeded };
  }
}

export default {
  ResourceDiscoveryProvider,
  CuratedAuthorityProvider,
  ExternalSearchProvider,
  ResourceDiscoveryService
};
