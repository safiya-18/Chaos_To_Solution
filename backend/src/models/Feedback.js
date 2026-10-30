import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      trim: true,
      default: null,
      index: true
    },
    teamName: {
      type: String,
      trim: true,
      default: null
    },
    domain: {
      type: String,
      trim: true,
      default: null
    },
    rating: {
      type: String,
      enum: [
        'excellent',
        'acceptable',
        'too_generic',
        'too_repetitive',
        'too_difficult',
        'too_easy',
        'resources_inaccessible',
        'restrictions_impractical',
        'poorly_defined',
        'unsafe_or_unsuitable'
      ],
      required: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    organizer: {
      type: String,
      trim: true,
      default: 'organizer'
    }
  },
  {
    timestamps: true
  }
);

FeedbackSchema.index({ rating: 1, createdAt: -1 });

export const Feedback = mongoose.model('Feedback', FeedbackSchema);
export default Feedback;
