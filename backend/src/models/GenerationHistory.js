import mongoose from 'mongoose';
import { APPROVED_THEMES } from '../utils/challengeValidator.js';

const GenerationHistorySchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      trim: true,
      default: null
    },
    domain: {
      type: String,
      required: true,
      enum: APPROVED_THEMES
    },
    candidateChallenge: {
      problem: {
        title: { type: String, trim: true },
        statement: { type: String, trim: true }
      },
      restriction: {
        name: { type: String, trim: true },
        rule: { type: String, trim: true }
      },
      resource: {
        name: { type: String, trim: true },
        type: { type: String, trim: true },
        guidance: { type: String, trim: true },
        docsUrl: { type: String, trim: true }
      },
      deliverable: { type: String, trim: true }
    },
    fingerprint: {
      type: String,
      required: true,
      index: true
    },
    similarityScores: {
      problemSimilarity: { type: Number, default: 0 },
      restrictionSimilarity: { type: Number, default: 0 },
      resourceOverlap: { type: Number, default: 0 },
      combinationNoveltyScore: { type: Number, default: 1 },
      overallSimilarity: { type: Number, default: 0 },
      semanticDiversitySimilarity: { type: Number, default: 0 },
      functionalEquivalenceScore: { type: Number, default: 0 }
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
    },
    provider: {
      type: String,
      enum: ['groq', 'gemini', 'curated-fallback', 'reference-bank'],
      required: true
    },
    model: {
      type: String,
      default: null
    },
    decision: {
      type: String,
      enum: ['accepted', 'rejected', 'regenerated', 'fallback_used'],
      required: true,
      index: true
    },
    rejectionReason: {
      type: String,
      default: null
    },
    validationErrors: {
      type: [String],
      default: []
    },
    organizerFeedback: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      default: null
    }
  },
  {
    timestamps: true
  }
);

GenerationHistorySchema.index({ domain: 1, createdAt: -1 });

export const GenerationHistory = mongoose.model('GenerationHistory', GenerationHistorySchema);
export default GenerationHistory;
