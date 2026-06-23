import React, { useState, useEffect } from 'react';
import './LandingPage.css';

export default function LandingPage({ onLaunch, themeMode, onCycleTheme }) {
  const [nickname, setNickname] = useState(
    localStorage.getItem('whiteboard_nickname') || ''
  );
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter a nickname to start');
      return;
    }
    localStorage.setItem('whiteboard_nickname', nickname.trim());
    onLaunch(nickname.trim());
  };

  // Generate floating background particles
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 5 + 4,
    }));
    setParticles(generated);
  }, []);

  // Theme details helper
  const getThemeDetails = () => {
    switch (themeMode) {
      case 'light':
        return { icon: '☀️', text: 'Light' };
      case 'dark':
        return { icon: '🌙', text: 'Dark' };
      case 'adaptive':
      default:
        return { icon: '🌓', text: 'Auto' };
    }
  };

  const themeDetails = getThemeDetails();

  return (
    <div className="landing-container">
      {/* Background Gradient Mesh */}
      <div className="mesh-gradient"></div>

      {/* Floating Particles */}
      <div className="particles-container">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Landing Content */}
      <div className="landing-content">
        <header className="landing-header">
          <div className="logo-container">
            <span className="logo-icon"></span>
            <h1 className="logo-text">NEON<span>BOARD</span></h1>
          </div>
          
          <div className="landing-header-actions">
            {/* Theme Switcher Button */}
            <button 
              className="theme-toggle-btn" 
              onClick={onCycleTheme} 
              title={`Current Theme: ${themeDetails.text}. Click to cycle.`}
            >
              <span className="theme-toggle-icon">{themeDetails.icon}</span>
              <span className="theme-toggle-text">{themeDetails.text}</span>
            </button>

            {/* Connection Status Pill */}
            <div className="connection-pill">
              <span className="pill-dot"></span>
              <span className="pill-text">v1.0.0 API CONNECTED</span>
            </div>
          </div>
        </header>

        <main className="landing-hero">
          <div className="hero-text-area">
            <h2 className="hero-title">
              Interactive Project Whiteboard <br />
              <span className="gradient-text">Real-Time Neon Workspace</span>
            </h2>
            <p className="hero-subtitle">
              An infinite collaborative board for team brainstorming, task coordination, and live ideation with smooth pan and zoom controls.
            </p>
          </div>

          {/* Dynamic Launch Widget */}
          <div className="launch-card glassmorphism">
            <h3 className="launch-card-title">Start Collaborating</h3>
            <p className="launch-card-desc">Enter your nickname to join the shared workspace with other visitors:</p>
            
            <form onSubmit={handleSubmit} className="launch-form">
              <div className="input-group">
                <input
                  type="text"
                  maxLength={15}
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g., Alex, Developer..."
                  className="nickname-input"
                />
                <span className="input-glow"></span>
              </div>
              {error && <p className="error-text">{error}</p>}
              <button type="submit" className="neon-btn launch-btn">
                ENTER WORKSPACE // LAUNCH
              </button>
            </form>
          </div>
        </main>

        {/* Features Grid */}
        <section className="features-grid">
          <div className="feature-card glassmorphism">
            <div className="feature-icon-wrapper font-icon">⚡</div>
            <h4>Real-Time Sync</h4>
            <p>Instant changes synchronized across all active users in milliseconds using Server-Sent Events (SSE).</p>
          </div>
          <div className="feature-card glassmorphism">
            <div className="feature-icon-wrapper font-icon">🔍</div>
            <h4>Infinite Canvas</h4>
            <p>Smooth pan and wheel zoom centering logic allows you to organize your workspace without boundaries.</p>
          </div>
          <div className="feature-card glassmorphism">
            <div className="feature-icon-wrapper font-icon">📝</div>
            <h4>Neon Sticky Notes</h4>
            <p>Double-click to create, drag around freely, edit content inline, and choose between custom dark and green colors.</p>
          </div>
          <div className="feature-card glassmorphism">
            <div className="feature-icon-wrapper font-icon">🛡️</div>
            <h4>Secure API Proxy</h4>
            <p>Node.js backend proxy handles all Firestore CRUD operations securely, keeping database keys hidden from client scripts.</p>
          </div>
        </section>

        {/* Tech Stack Footer */}
        <footer className="landing-footer">
          <p className="tech-stack-title">Technologies Used in This Project</p>
          <div className="tech-badges">
            <span className="tech-badge">React</span>
            <span className="tech-badge">Vite</span>
            <span className="tech-badge">Node.js</span>
            <span className="tech-badge">Express</span>
            <span className="tech-badge">Server-Sent Events</span>
            <span className="tech-badge">Google Firestore</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
