import React, { useState, useEffect, useRef } from 'react';
import './StickyNote.css';

export default function StickyNote({
  note,
  onDragStart,
  onResizeStart, // Added resize handler
  onUpdateNote,
  onDeleteNote,
  currentUserId,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note.content);
  const textareaRef = useRef(null);

  // Sync state text with note content changes from database
  useEffect(() => {
    if (!isEditing) {
      setText(note.content);
    }
  }, [note.content, isEditing]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e) => {
    e.stopPropagation(); // Prevent canvas actions
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() !== note.content) {
      onUpdateNote(note.id, { content: text.trim() });
    }
  };

  const handleKeyDown = (e) => {
    // Save on Enter (without Shift) or Ctrl/Cmd + Enter
    if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      setIsEditing(false);
      if (text.trim() !== note.content) {
        onUpdateNote(note.id, { content: text.trim() });
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setText(note.content); // Reset
    }
  };

  const handleColorChange = (colorClass, e) => {
    e.stopPropagation();
    onUpdateNote(note.id, { color: colorClass });
  };

  // Color classes map for colors
  const colorOptions = [
    { name: 'neon-green', label: 'Neon' },
    { name: 'emerald', label: 'Emerald' },
    { name: 'mint', label: 'Mint' },
    { name: 'obsidian', label: 'Obsidian' },
    { name: 'charcoal', label: 'Charcoal' }
  ];

  const isOptimistic = String(note.id).startsWith('temp-');

  return (
    <div
      className="sticky-note-wrapper"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${note.x}px, ${note.y}px)`,
        zIndex: isEditing ? 20 : 10,
      }}
    >
      <div
        className={`sticky-note-card ${note.color} ${isEditing ? 'editing' : ''} ${isOptimistic ? 'optimistic' : ''}`}
        style={{
          width: `${note.width || 220}px`,
          height: `${note.height || 180}px`,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Note Header / Drag Handle */}
        <div 
          className="note-header"
          onMouseDown={(e) => onDragStart(note.id, e)}
        >
          <div className="drag-handle-dots">
            <span></span><span></span><span></span>
          </div>
          
          {/* Hover Toolbar */}
          <div className="note-toolbar" onMouseDown={(e) => e.stopPropagation()}>
            <div className="color-selectors">
              {colorOptions.map((opt) => (
                <button
                  key={opt.name}
                  className={`color-dot-btn ${opt.name} ${note.color === opt.name ? 'active' : ''}`}
                  onClick={(e) => handleColorChange(opt.name, e)}
                  title={opt.label}
                />
              ))}
            </div>
            <button 
              className="note-delete-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNote(note.id);
              }}
              title="Delete Note"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Note Content */}
        <div className="note-body">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="note-editor"
              maxLength={200}
              placeholder="Type your note here..."
            />
          ) : (
            <p className="note-text-display">
              {note.content || 'Double-click to edit...'}
            </p>
          )}
        </div>

        {/* Note Footer: Editor Info */}
        <div className="note-footer">
          <span className="editor-name">✍️ {note.lastEditedBy || 'Anonymous'}</span>
        </div>

        {/* Resize Handle - bottom right corner */}
        <div
          className="note-resize-handle"
          onMouseDown={(e) => onResizeStart(note.id, e)}
          title="Drag to resize note"
        />
      </div>
    </div>
  );
}
