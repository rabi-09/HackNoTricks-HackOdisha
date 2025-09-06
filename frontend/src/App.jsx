import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { FiHome, FiPlus, FiList } from 'react-icons/fi';
import Dashboard from './components/Dashboard';
import CreateSurvey from './components/CreateSurvey';
import SurveyForm from './components/SurveyForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="container">
            <nav className="nav">
              <div className="nav-brand">
                <h2>AI Survey Portal</h2>
              </div>
              <div className="nav-menu">
                <Link to="/" className="nav-link">
                  <FiHome /> Dashboard
                </Link>
                <Link to="/create" className="nav-link">
                  <FiPlus /> Create Survey
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateSurvey />} />
            <Route path="/survey/:id" element={<SurveyForm />} />
          </Routes>
        </main>

        {/* Toast Notifications */}
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
