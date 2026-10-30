import mongoose from 'mongoose';

const RestrictionCatalogSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    rule: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        'time_and_delivery',
        'budget_and_service_limits',
        'device_and_performance',
        'network_and_offline',
        'privacy_and_security',
        'accessibility_and_inclusion',
        'api_usage_constraints',
        'technology_and_architecture',
        'ui_and_interaction',
        'data_and_storage',
        'general'
      ],
      default: 'general',
      index: true
    },
    applicableDomains: {
      type: [String],
      default: []
    },
    difficultyImpact: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    fingerprint: {
      type: String,
      required: true,
      unique: true,
      index: true
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

RestrictionCatalogSchema.index({ category: 1, applicableDomains: 1 });

export const RestrictionCatalog = mongoose.model('RestrictionCatalog', RestrictionCatalogSchema);
export default RestrictionCatalog;
