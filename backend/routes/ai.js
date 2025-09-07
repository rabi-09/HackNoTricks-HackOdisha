const express = require('express');
const axios = require('axios');
const router = express.Router();

// AI Service URL (Flask microservice)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// Generate survey using AI
router.post('/generate-survey', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      targetAudience,
      numberOfQuestions = 8,
      questionTypes = ['multiple-choice', 'text', 'rating-scale']
    } = req.body;

    // Validation
    if (!title || !description || !category || !targetAudience) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    if (numberOfQuestions < 5 || numberOfQuestions > 15) {
      return res.status(400).json({
        success: false,
        message: 'Number of questions must be between 5 and 15'
      });
    }

    // Call AI microservice
    console.log('Calling AI service for survey generation...');
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate-survey`, {
      title,
      description,
      category,
      targetAudience,
      numberOfQuestions,
      questionTypes
    }, {
      timeout: 30000 // 30 seconds timeout
    });

    if (aiResponse.data.success) {
      res.json({
        success: true,
        message: 'Survey generated successfully',
        survey: {
          title,
          description,
          category,
          targetAudience,
          questions: aiResponse.data.questions,
          aiGenerated: true
        }
      });
    } else {
      throw new Error(aiResponse.data.message || 'AI service failed');
    }

  } catch (error) {
    console.error('AI generation error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is currently unavailable. Please try again later.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to generate survey with AI'
    });
  }
});

// Improve questions using AI
router.post('/improve-questions', async (req, res) => {
  try {
    const { questions, improvementGoals = ['clarity'] } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required'
      });
    }

    // Call AI microservice
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/improve-questions`, {
      questions,
      improvementGoals
    }, {
      timeout: 30000
    });

    res.json({
      success: true,
      message: 'Questions improved successfully',
      improvedQuestions: aiResponse.data.improvedQuestions
    });

  } catch (error) {
    console.error('Question improvement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to improve questions with AI'
    });
  }
});

// Get survey suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { category, targetAudience } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }

    // Call AI microservice
    const aiResponse = await axios.get(`${AI_SERVICE_URL}/suggestions`, {
      params: { category, targetAudience },
      timeout: 15000
    });

    res.json({
      success: true,
      suggestions: aiResponse.data.suggestions
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI suggestions'
    });
  }
});

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const aiResponse = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    res.json({
      success: true,
      aiServiceStatus: aiResponse.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI service is unavailable',
      aiServiceStatus: 'offline'
    });
  }
});

module.exports = router;
