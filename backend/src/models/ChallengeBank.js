import mongoose from 'mongoose';
import { APPROVED_THEMES } from '../utils/challengeValidator.js';

const ChallengeBankSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    problemStatement: {
      type: String,
      required: true,
      trim: true
    },
    restriction: {
      type: String,
      required: true,
      trim: true
    },
    resourceText: {
      type: String,
      required: true,
      trim: true
    },
    deliverable: {
      type: String,
      trim: true,
      default: null
    },
    resourceTag: {
      type: String,
      trim: true,
      default: null
    },
    resources: [
      {
        name: { type: String, trim: true },
        canonicalUrl: { type: String, trim: true },
        resourceType: { type: String, trim: true },
        verificationStatus: {
          type: String,
          enum: ['candidate', 'verification_pending', 'verified', 'inaccessible', 'needs_manual_review', 'failed', 'pending'],
          default: 'candidate'
        }
      }
    ],
    domain: {
      type: String,
      required: true,
      enum: APPROVED_THEMES
    },
    subdomain: {
      type: String,
      trim: true,
      default: null
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    skills: {
      type: [String],
      default: []
    },
    estimatedBuildTime: {
      type: String,
      default: '3-6 hours'
    },
    sourceType: {
      type: String,
      enum: ['pdf_benchmark', 'organizer_created', 'approved_ai_generated', 'manual_import'],
      required: true
    },
    sourceFile: {
      type: String,
      trim: true,
      required: true
    },
    sourcePage: {
      type: Number,
      required: true
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: null
    },
    sourceRetrievedAt: {
      type: Date,
      default: Date.now
    },
    approvalStatus: {
      type: String,
      enum: ['approved', 'pending_review', 'rejected'],
      default: 'pending_review'
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    },
    fingerprint: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

ChallengeBankSchema.index({ domain: 1, approvalStatus: 1 });

export const ChallengeBank = mongoose.model('ChallengeBank', ChallengeBankSchema);
export default ChallengeBank;
