import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEye, FiUsers, FiBarChart, FiEdit } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await axios.get('/api/surveys');
      setSurveys(response.data.surveys || []);
      
      // Calculate stats
      const totalSurveys = response.data.surveys?.length || 0;
      const totalResponses = response.data.surveys?.reduce((sum, survey) => sum + (survey.responseCount || 0), 0) || 0;
      const activeSurveys = response.data.surveys?.filter(survey => survey.status === 'published').length || 0;
      
      setStats({ totalSurveys, totalResponses, activeSurveys });
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const deleteSurvey = async (id) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) return;
    
    try {
      await axios.delete(`/api/surveys/${id}`);
      toast.success('Survey deleted successfully');
      fetchSurveys();
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast.error('Failed to delete survey');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading surveys...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero">
        <h1>Welcome to AI Survey Portal</h1>
        <p>Create intelligent surveys powered by AI. Generate comprehensive questionnaires tailored to your specific needs.</p>
        <Link to="/create" className="btn btn-primary btn-large">
          <FiPlus /> Create Your First Survey
        </Link>
      </section>

      {/* Stats Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FiBarChart />
          </div>
          <div className="stat-content">
            <h3>Total Surveys</h3>
            <p className="stat-number">{stats.totalSurveys}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>Total Responses</h3>
            <p className="stat-number">{stats.totalResponses}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FiEye />
          </div>
          <div className="stat-content">
            <h3>Active Surveys</h3>
            <p className="stat-number">{stats.activeSurveys}</p>
          </div>
        </div>
      </section>

      {/* Recent Surveys */}
      <section className="surveys-section">
        <div className="section-header">
          <h2>Your Surveys</h2>
          <Link to="/create" className="btn btn-secondary">
            <FiPlus /> New Survey
          </Link>
        </div>

        {surveys.length === 0 ? (
          <div className="empty-state">
            <FiBarChart className="empty-icon" />
            <h3>No surveys yet</h3>
            <p>Get started by creating your first AI-powered survey</p>
            <Link to="/create" className="btn btn-primary">
              <FiPlus /> Create Survey
            </Link>
          </div>
        ) : (
          <div className="surveys-grid">
            {surveys.map(survey => (
              <div key={survey._id} className="survey-card">
                <div className="survey-header">
                  <h3>{survey.title}</h3>
                  <span className={`status-badge status-${survey.status}`}>
                    {survey.status}
                  </span>
                </div>
                <p className="survey-description">{survey.description}</p>
                <div className="survey-meta">
                  <span className="question-count">{survey.questions?.length || 0} questions</span>
                  <span className="response-count">{survey.responseCount || 0} responses</span>
                </div>
                <div className="survey-actions">
                  <Link to={`/survey/${survey._id}`} className="btn btn-sm btn-outline">
                    <FiEye /> View
                  </Link>
                  <button 
                    onClick={() => deleteSurvey(survey._id)}
                    className="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
