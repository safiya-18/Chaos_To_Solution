import mongoose from 'mongoose';
import { APPROVED_THEMES } from '../utils/challengeValidator.js';
import config from '../config/env.js';

const ProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    statement: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const RestrictionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rule: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const ResourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['browser-api', 'public-api', 'local-dataset']
    },
    guidance: { type: String, required: true, trim: true },
    docsUrl: { type: String, required: true, trim: true },
    verificationStatus: {
      type: String,
      enum: ['verified', 'verification_pending', 'candidate', 'needs_manual_review', 'inaccessible'],
      default: 'candidate'
    }
  },
  { _id: false }
);

const ChallengeSchema = new mongoose.Schema(
  {
    problem: { type: ProblemSchema, required: true },
    restriction: { type: RestrictionSchema, required: true },
    resource: { type: ResourceSchema, required: true },
    deliverable: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const TeamAssignmentSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required.'],
      trim: true,
      minlength: [2, 'Team name must be at least 2 characters.'],
      maxlength: [50, 'Team name cannot exceed 50 characters.']
    },
    normalizedTeamName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      default: function () {
        return normalizeTeamName(this.teamName);
      }
    },
    theme: {
      type: String,
      required: [true, 'Theme is required.'],
      enum: {
        values: APPROVED_THEMES,
        message: '{VALUE} is not an approved hackathon theme.'
      }
    },
    challenge: {
      type: ChallengeSchema,
      required: true
    },
    challengeSource: {
      type: String,
      required: true,
      enum: ['ai', 'curated-fallback']
    },
    challengeId: {
      type: String,
      required: true,
      trim: true
    },
    challengeSignature: {
      type: String,
      trim: true,
      default: null,
      set: (v) => (v && typeof v === 'string' && v.trim().length > 0 ? v.trim() : null)
    },
    eventId: {
      type: String,
      default: () => config.eventId,
      trim: true
    },
    diversityProfile: {
      subdomain: { type: String, trim: true, default: null },
      solutionArchetype: { type: String, trim: true, default: null },
      userPersona: { type: String, trim: true, default: null },
      primaryWorkflow: { type: String, trim: true, default: null },
      technicalApproach: { type: String, trim: true, default: null },
      datasetType: { type: String, trim: true, default: null },
      problemCategory: { type: String, trim: true, default: null },
      coreAlgorithm: { type: String, trim: true, default: null },
      engineeringTask: { type: String, trim: true, default: null },
      inputStructure: { type: String, trim: true, default: null },
      outputStructure: { type: String, trim: true, default: null },
      dataProcessingStrategy: { type: String, trim: true, default: null },
      technicalConstraints: { type: String, trim: true, default: null },
      deliverableType: { type: String, trim: true, default: null }
    }
  },
  {
    timestamps: true
  }
);

/**
 * Atomic Unique Compound Index:
 * Scoped to (eventId, challengeSignature).
 * Uses partialFilterExpression to ignore documents where challengeSignature is null or missing,
 * ensuring seamless compatibility with legacy records and preventing index collisions on nulls.
 */
TeamAssignmentSchema.index(
  { eventId: 1, challengeSignature: 1 },
  {
    unique: true,
    partialFilterExpression: {
      challengeSignature: { $type: 'string' }
    }
  }
);

/**
 * Normalizes a team name for case-insensitive duplicate matching.
 */
export const normalizeTeamName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toLowerCase();
};

TeamAssignmentSchema.pre('validate', function () {
  if (this.teamName && !this.normalizedTeamName) {
    this.normalizedTeamName = normalizeTeamName(this.teamName);
  }
});

export const TeamAssignment = mongoose.model('TeamAssignment', TeamAssignmentSchema);
export default TeamAssignment;
