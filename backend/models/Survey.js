const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['text', 'multiple-choice', 'rating-scale', 'yes-no']
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  options: [{
    type: String,
    trim: true
  }],
  required: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  }
}, { _id: true });

const SurveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Survey title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Survey description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['feedback', 'research', 'evaluation', 'marketing', 'other']
  },
  targetAudience: {
    type: String,
    required: true,
    enum: ['employees', 'customers', 'students', 'general']
  },
  questions: [QuestionSchema],
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft'
  },
  responseCount: {
    type: Number,
    default: 0
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    default: 'anonymous'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for survey URL
SurveySchema.virtual('surveyUrl').get(function() {
  return `${process.env.FRONTEND_URL}/survey/${this._id}`;
});

// Indexes for better performance
SurveySchema.index({ status: 1, createdAt: -1 });
SurveySchema.index({ category: 1 });
SurveySchema.index({ targetAudience: 1 });

module.exports = mongoose.model('Survey', SurveySchema);
