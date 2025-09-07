const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const Response = require('../models/Response');

// Get all surveys
router.get('/', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const surveys = await Survey.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Survey.countDocuments(filter);

    res.json({
      success: true,
      surveys,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surveys'
    });
  }
});

// Get single survey
router.get('/:id', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    res.json({
      success: true,
      survey
    });
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey'
    });
  }
});

// Create survey
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      targetAudience,
      questions,
      status = 'draft',
      aiGenerated = false
    } = req.body;

    // Validation
    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters long'
      });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters long'
      });
    }

    if (!['feedback', 'research', 'evaluation', 'marketing', 'other'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    if (!['employees', 'customers', 'students', 'general'].includes(targetAudience)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target audience'
      });
    }

    // Format questions
    const formattedQuestions = questions?.map((q, index) => ({
      ...q,
      order: index
    })) || [];

    const survey = new Survey({
      title: title.trim(),
      description: description.trim(),
      category,
      targetAudience,
      questions: formattedQuestions,
      status,
      aiGenerated
    });

    await survey.save();

    res.status(201).json({
      success: true,
      message: 'Survey created successfully',
      survey
    });
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create survey'
    });
  }
});

// Update survey
router.put('/:id', async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    res.json({
      success: true,
      message: 'Survey updated successfully',
      survey
    });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update survey'
    });
  }
});

// Delete survey
router.delete('/:id', async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Delete associated responses
    await Response.deleteMany({ surveyId: req.params.id });

    res.json({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete survey'
    });
  }
});

// Update survey status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'published', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    res.json({
      success: true,
      message: `Survey ${status} successfully`,
      survey
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update survey status'
    });
  }
});

module.exports = router;
