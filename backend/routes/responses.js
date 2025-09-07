const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const Survey = require('../models/Survey');

// Submit survey response
router.post('/', async (req, res) => {
  try {
    const { surveyId, answers, startTime } = req.body;

    // Validation
    if (!surveyId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Survey ID and answers are required'
      });
    }

    // Check if survey exists and is published
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    if (survey.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Survey is not available for responses'
      });
    }

    // Validate answers
    const questionIds = survey.questions.map(q => q._id.toString());
    const validAnswers = answers.filter(answer => 
      questionIds.includes(answer.questionId.toString())
    );

    if (validAnswers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid answers provided'
      });
    }

    // Calculate duration
    const submitTime = new Date();
    const duration = startTime 
      ? Math.round((submitTime - new Date(startTime)) / 1000)
      : 0;

    // Create response
    const response = new Response({
      surveyId,
      answers: validAnswers,
      metadata: {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        startTime: startTime ? new Date(startTime) : new Date(),
        submitTime,
        duration
      }
    });

    await response.save();

    // Update survey response count
    await Survey.findByIdAndUpdate(surveyId, {
      $inc: { responseCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Response submitted successfully',
      responseId: response._id
    });

  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response'
    });
  }
});

// Get responses for a survey
router.get('/survey/:surveyId', async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    const responses = await Response.find({ surveyId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Response.countDocuments({ surveyId });

    res.json({
      success: true,
      responses,
      survey: {
        id: survey._id,
        title: survey.title,
        totalQuestions: survey.questions.length
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch responses'
    });
  }
});

// Get response analytics
router.get('/analytics/:surveyId', async (req, res) => {
  try {
    const { surveyId } = req.params;

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    const responses = await Response.find({ surveyId });

    // Generate basic analytics
    const analytics = {
      totalResponses: responses.length,
      averageDuration: responses.length > 0 
        ? Math.round(responses.reduce((sum, r) => sum + (r.metadata.duration || 0), 0) / responses.length)
        : 0,
      responsesByDay: {},
      questionAnalytics: []
    };

    // Group responses by day
    responses.forEach(response => {
      const day = response.createdAt.toISOString().split('T')[0];
      analytics.responsesByDay[day] = (analytics.responsesByDay[day] || 0) + 1;
    });

    // Analyze each question
    survey.questions.forEach(question => {
      const questionResponses = responses
        .map(r => r.answers.find(a => a.questionId.toString() === question._id.toString()))
        .filter(Boolean);

      const questionAnalytic = {
        questionId: question._id,
        questionText: question.text,
        type: question.type,
        responseCount: questionResponses.length,
        responses: questionResponses.map(r => r.value)
      };

      // Add type-specific analytics
      if (question.type === 'multiple-choice') {
        const counts = {};
        questionResponses.forEach(r => {
          counts[r.value] = (counts[r.value] || 0) + 1;
        });
        questionAnalytic.optionCounts = counts;
      }

      if (question.type === 'rating-scale') {
        const ratings = questionResponses.map(r => parseInt(r.value)).filter(r => !isNaN(r));
        questionAnalytic.averageRating = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
          : 0;
      }

      analytics.questionAnalytics.push(questionAnalytic);
    });

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics'
    });
  }
});

module.exports = router;
