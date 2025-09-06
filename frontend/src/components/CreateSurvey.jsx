import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiWand2, FiSave, FiEye } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateSurvey = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSurvey, setGeneratedSurvey] = useState(null);
  const [currentStep, setCurrentStep] = useState('form'); // 'form', 'preview'

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      numberOfQuestions: 8,
      questionTypes: ['multiple-choice', 'text', 'rating-scale']
    }
  });

  const handleGenerateSurvey = async (formData) => {
    setIsGenerating(true);
    try {
      // Call AI service to generate survey
      const response = await axios.post('/api/ai/generate-survey', formData);
      
      if (response.data.success) {
        setGeneratedSurvey(response.data.survey);
        setCurrentStep('preview');
        toast.success('Survey generated successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to generate survey');
      }
    } catch (error) {
      console.error('Error generating survey:', error);
      toast.error(error.response?.data?.message || 'Failed to generate survey');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSurvey = async (publish = false) => {
    if (!generatedSurvey) return;

    try {
      const surveyData = {
        ...generatedSurvey,
        status: publish ? 'published' : 'draft'
      };

      const response = await axios.post('/api/surveys', surveyData);
      
      if (response.data.success) {
        toast.success(`Survey ${publish ? 'published' : 'saved'} successfully!`);
        if (publish) {
          navigate(`/survey/${response.data.survey._id}`);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      toast.error('Failed to save survey');
    }
  };

  if (currentStep === 'preview' && generatedSurvey) {
    return (
      <div className="container">
        <div className="survey-preview">
          <div className="preview-header">
            <h1>Survey Preview</h1>
            <p>Review your AI-generated survey</p>
            <div className="preview-actions">
              <button 
                onClick={() => setCurrentStep('form')}
                className="btn btn-secondary"
              >
                Back to Form
              </button>
              <button 
                onClick={() => handleSaveSurvey(false)}
                className="btn btn-outline"
              >
                <FiSave /> Save Draft
              </button>
              <button 
                onClick={() => handleSaveSurvey(true)}
                className="btn btn-primary"
              >
                <FiEye /> Publish Survey
              </button>
            </div>
          </div>

          <div className="survey-preview-content">
            <h2>{generatedSurvey.title}</h2>
            <p>{generatedSurvey.description}</p>
            
            <div className="questions-preview">
              {generatedSurvey.questions.map((question, index) => (
                <div key={index} className="question-preview">
                  <h4>Question {index + 1}: {question.text}</h4>
                  <p className="question-type">Type: {question.type}</p>
                  {question.options && question.options.length > 0 && (
                    <ul className="question-options">
                      {question.options.map((option, optIndex) => (
                        <li key={optIndex}>{option}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="create-survey-header">
        <h1>Create New Survey</h1>
        <p>Use AI to generate intelligent survey questions</p>
      </div>

      <form onSubmit={handleSubmit(handleGenerateSurvey)} className="create-survey-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Survey Title *</label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="e.g., Employee Satisfaction Survey"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 3, message: 'Title too short' }
              })}
            />
            {errors.title && <span className="error-text">{errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Describe the purpose of your survey..."
              rows="4"
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Description too short' }
              })}
            />
            {errors.description && <span className="error-text">{errors.description.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                className={`form-select ${errors.category ? 'error' : ''}`}
                {...register('category', { required: 'Category is required' })}
              >
                <option value="">Select Category</option>
                <option value="feedback">Feedback</option>
                <option value="research">Research</option>
                <option value="evaluation">Evaluation</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
              {errors.category && <span className="error-text">{errors.category.message}</span>}
            </div>

            <div className="form-group">
              <label>Target Audience *</label>
              <select
                className={`form-select ${errors.targetAudience ? 'error' : ''}`}
                {...register('targetAudience', { required: 'Target audience is required' })}
              >
                <option value="">Select Audience</option>
                <option value="employees">Employees</option>
                <option value="customers">Customers</option>
                <option value="students">Students</option>
                <option value="general">General Public</option>
              </select>
              {errors.targetAudience && <span className="error-text">{errors.targetAudience.message}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>AI Configuration</h2>
          
          <div className="form-group">
            <label>Number of Questions: {watch('numberOfQuestions')}</label>
            <input
              type="range"
              min="5"
              max="15"
              className="form-range"
              {...register('numberOfQuestions')}
            />
            <div className="range-labels">
              <span>5</span>
              <span>15</span>
            </div>
          </div>

          <div className="form-group">
            <label>Question Types</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value="multiple-choice"
                  {...register('questionTypes')}
                />
                Multiple Choice
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value="text"
                  {...register('questionTypes')}
                />
                Text Response
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value="rating-scale"
                  {...register('questionTypes')}
                />
                Rating Scale
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value="yes-no"
                  {...register('questionTypes')}
                />
                Yes/No
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isGenerating}
            className="btn btn-primary btn-large"
          >
            <FiWand2 />
            {isGenerating ? 'Generating Survey...' : 'Generate AI Survey'}
          </button>
        </div>
      </form>

      {isGenerating && (
        <div className="generating-overlay">
          <div className="generating-content">
            <div className="spinner"></div>
            <h3>AI is generating your survey...</h3>
            <p>This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSurvey;
