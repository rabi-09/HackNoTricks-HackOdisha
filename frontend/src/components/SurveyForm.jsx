import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const SurveyForm = () => {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      const response = await axios.get(`/api/surveys/${id}`);
      if (response.data.success) {
        setSurvey(response.data.survey);
      } else {
        toast.error('Survey not found');
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
      toast.error('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < survey.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Prepare responses for submission
      const answersArray = Object.entries(responses).map(([questionId, value]) => ({
        questionId,
        value
      }));

      const submissionData = {
        surveyId: id,
        answers: answersArray,
        startTime: new Date().toISOString()
      };

      const response = await axios.post('/api/responses', submissionData);
      
      if (response.data.success) {
        setSubmitted(true);
        toast.success('Survey submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const questionId = question._id;
    const currentValue = responses[questionId] || '';

    switch (question.type) {
      case 'text':
        return (
          <textarea
            className="form-textarea"
            placeholder="Type your answer here..."
            value={currentValue}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            rows="4"
          />
        );

      case 'multiple-choice':
        return (
          <div className="radio-group">
            {question.options.map((option, index) => (
              <label key={index} className="radio-label">
                <input
                  type="radio"
                  name={questionId}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating-scale':
        return (
          <div className="rating-group">
            {[1, 2, 3, 4, 5].map(rating => (
              <label key={rating} className="rating-label">
                <input
                  type="radio"
                  name={questionId}
                  value={rating}
                  checked={currentValue === rating.toString()}
                  onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                />
                <span className="rating-number">{rating}</span>
              </label>
            ))}
            <div className="rating-labels">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        );

      case 'yes-no':
        return (
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name={questionId}
                value="yes"
                checked={currentValue === 'yes'}
                onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              />
              <span>Yes</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name={questionId}
                value="no"
                checked={currentValue === 'no'}
                onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              />
              <span>No</span>
            </label>
          </div>
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading survey...</div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="container">
        <div className="error-state">
          <h2>Survey Not Found</h2>
          <p>The survey you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container">
        <div className="success-state">
          <FiCheck className="success-icon" />
          <h2>Thank You!</h2>
          <p>Your response has been submitted successfully.</p>
          <p className="survey-title">Survey: {survey.title}</p>
        </div>
      </div>
    );
  }

  const currentQuestionData = survey.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / survey.questions.length) * 100;
  const isLastQuestion = currentQuestion === survey.questions.length - 1;
  const canProceed = responses[currentQuestionData._id] || !currentQuestionData.required;

  return (
    <div className="container">
      <div className="survey-form">
        <div className="survey-header">
          <h1>{survey.title}</h1>
          <p>{survey.description}</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">
            Question {currentQuestion + 1} of {survey.questions.length}
          </p>
        </div>

        <div className="question-container">
          <div className="question">
            <h2>
              {currentQuestionData.text}
              {currentQuestionData.required && <span className="required">*</span>}
            </h2>
            <div className="question-input">
              {renderQuestion(currentQuestionData)}
            </div>
          </div>

          <div className="question-actions">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={!canProceed || submitting}
                className="btn btn-primary"
              >
                <FiCheck />
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="btn btn-primary"
              >
                Next <FiArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyForm;
