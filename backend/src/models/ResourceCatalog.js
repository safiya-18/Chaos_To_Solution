import mongoose from 'mongoose';

const VerificationEvidenceSchema = new mongoose.Schema(
  {
    checkedUrl: { type: String, trim: true },
    checkedAt: { type: Date, default: Date.now },
    httpStatus: { type: Number, default: null },
    ipAddress: { type: String, default: null },
    responseTimeMs: { type: Number, default: null },
    matchedKeywords: { type: [String], default: [] },
    limitations: { type: [String], default: [] },
    notes: { type: String, default: '' }
  },
  { _id: false }
);

const ResourceCatalogSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    canonicalUrl: {
      type: String,
      trim: true,
      default: null
    },
    resourceType: {
      type: String,
      enum: ['browser-api', 'public-api', 'local-dataset', 'open-source-library', 'documentation', 'tool', 'other'],
      default: 'other'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    domains: {
      type: [String],
      default: []
    },
    capabilities: {
      type: [String],
      default: []
    },
    useCases: {
      type: [String],
      default: []
    },
    pricingStatus: {
      type: String,
      enum: ['free', 'free_tier', 'paid', 'mixed', 'unknown'],
      default: 'unknown'
    },
    apiKeyRequired: {
      type: Boolean,
      default: false
    },
    registrationRequired: {
      type: Boolean,
      default: false
    },
    accessRequirements: {
      type: String,
      trim: true,
      default: ''
    },
    license: {
      type: String,
      trim: true,
      default: 'unknown'
    },
    usageLimitations: {
      type: String,
      trim: true,
      default: ''
    },
    geographicLimitations: {
      type: String,
      trim: true,
      default: ''
    },
    documentationUrl: {
      type: String,
      trim: true,
      default: null
    },
    rateLimits: {
      type: String,
      trim: true,
      default: ''
    },
    sourceProvenance: {
      type: String,
      enum: ['pdf_import', 'online_discovery', 'curated_catalog', 'organizer_submission'],
      default: 'pdf_import'
    },
    verificationStatus: {
      type: String,
      enum: ['candidate', 'verification_pending', 'verified', 'inaccessible', 'needs_manual_review', 'failed', 'pending'],
      default: 'candidate',
      index: true
    },
    verificationEvidence: {
      type: VerificationEvidenceSchema,
      default: () => ({})
    },
    lastVerifiedAt: {
      type: Date,
      default: null
    },
    cacheExpiresAt: {
      type: Date,
      default: null
    },
    active: {
      type: Boolean,
      default: true
    },
    timesUsed: {
      type: Number,
      default: 0
    },
    lastUsedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

ResourceCatalogSchema.index({ domains: 1, verificationStatus: 1 });
ResourceCatalogSchema.index({ name: 'text', description: 'text' });
ResourceCatalogSchema.index({ canonicalUrl: 1 });

export const ResourceCatalog = mongoose.model('ResourceCatalog', ResourceCatalogSchema);
export default ResourceCatalog;
