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
    docsUrl: { type: String, required: true, trim: true }
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
    eventId: {
      type: String,
      default: () => config.eventId,
      trim: true
    }
  },
  {
    timestamps: true
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
