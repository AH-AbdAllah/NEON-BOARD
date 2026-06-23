import React from 'react';
import './TrashBin.css';

export default function TrashBin({ isDragging, isHovered }) {
  return (
    <div 
      id="trash-bin-zone"
      className={`trash-bin-container glassmorphism 
        ${isDragging ? 'visible' : ''} 
        ${isHovered ? 'hovered' : ''}`}
    >
      <div className="trash-bin-content">
        <span className="trash-icon">{isHovered ? '🔥' : '🗑️'}</span>
        <span className="trash-text">
          {isHovered ? 'Release to Delete Note' : 'Drag note here to delete'}
        </span>
      </div>
      <div className="trash-glow-overlay"></div>
    </div>
  );
}
