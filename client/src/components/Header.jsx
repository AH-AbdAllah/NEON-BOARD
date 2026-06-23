import React from 'react';
import './Header.css';

export default function Header({ 
  nickname, 
  onBack, 
  zoom, 
  setZoom, 
  setPan, 
  notesCount, 
  isDisconnected,
  themeMode,
  onCycleTheme
}) {
  
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.1, 0.25));
  };

  // Get theme indicator labels/icons
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
    <header className="board-header glassmorphism">
      <div className="board-branding" onClick={onBack} title="Back to Landing Page">
        <span className="logo-dot"></span>
        <h2>NEON<span>BOARD</span></h2>
      </div>

      <div className="board-status-group">
        {/* Status Pill */}
        <div className={`status-pill ${isDisconnected ? 'disconnected' : 'connected'}`}>
          <span className="status-dot"></span>
          <span className="status-label">
            {isDisconnected ? 'DISCONNECTED' : 'CONNECTED'}
          </span>
        </div>

        {/* Notes Count */}
        <div className="stats-pill">
          <span className="stats-number">{notesCount}</span>
          <span className="stats-label">Notes</span>
        </div>

        {/* User Info */}
        <div className="user-pill">
          <span className="user-avatar">👤</span>
          <span className="user-nickname">{nickname}</span>
        </div>
      </div>

      {/* Navigation & Controls */}
      <div className="board-controls-group">
        {/* Theme Switcher Button */}
        <button 
          className="theme-toggle-btn" 
          onClick={onCycleTheme} 
          title={`Current Theme: ${themeDetails.text}. Click to cycle.`}
        >
          <span className="theme-toggle-icon">{themeDetails.icon}</span>
          <span className="theme-toggle-text">{themeDetails.text}</span>
        </button>

        {/* Zoom Widgets */}
        <div className="zoom-widget">
          <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">-</button>
          <span className="zoom-percentage" onClick={handleReset} title="Reset Zoom">{Math.round(zoom * 100)}%</span>
          <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
        </div>

        <button className="reset-view-btn" onClick={handleReset} title="Reset View">
          🔍 Reset View
        </button>

        <button className="back-btn" onClick={onBack} title="Exit Workspace">
          🚪 Exit
        </button>
      </div>
    </header>
  );
}
