const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Survey.questions'
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const ResponseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
    index: true
  },
  answers: [AnswerSchema],
  metadata: {
    ip: String,
    userAgent: String,
    startTime: Date,
    submitTime: {
      type: Date,
      default: Date.now
    },
    duration: Number // in seconds
  },
  anonymous: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes
ResponseSchema.index({ surveyId: 1, createdAt: -1 });

module.exports = mongoose.model('Response', ResponseSchema);
