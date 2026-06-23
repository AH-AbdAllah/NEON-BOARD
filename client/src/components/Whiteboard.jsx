import React, { useRef, useState, useEffect } from 'react';
import StickyNote from './StickyNote';
import TrashBin from './TrashBin';
import './Whiteboard.css';

export default function Whiteboard({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  nickname,
  zoom,
  setZoom,
  pan,
  setPan,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Panning State
  const [isPanning, setIsPanning] = useState(false);
  const panStartMouse = useRef({ x: 0, y: 0 });
  const panStartOffset = useRef({ x: 0, y: 0 });

  // Note Dragging State
  const [activeDragId, setActiveDragId] = useState(null);
  const [draggedNotesState, setDraggedNotesState] = useState({}); // Local position overrides
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragStartNote = useRef({ x: 0, y: 0 });
  const [isOverTrash, setIsOverTrash] = useState(false);

  // Note Resizing State
  const [activeResizeId, setActiveResizeId] = useState(null);
  const [resizedNotesState, setResizedNotesState] = useState({}); // Local size overrides
  const resizeStartMouse = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 220, height: 180 });

  // 1. Mouse wheel zoom (centered on cursor)
  const handleWheel = (e) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomIntensity = 0.08;
    const delta = e.deltaY < 0 ? 1 : -1;
    const nextZoom = Math.min(Math.max(zoom * (1 + delta * zoomIntensity), 0.25), 3);

    // Zoom centering logic
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Adjust pan to zoom centered on mouse cursor
    const dx = (mouseX - pan.x) * (1 - nextZoom / zoom);
    const dy = (mouseY - pan.y) * (1 - nextZoom / zoom);

    setPan((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setZoom(nextZoom);
  };

  // Attach non-passive wheel event listener to container
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom, pan]);

  // 2. Double-click to create new note
  const handleDoubleClick = (e) => {
    // Only create note if double-clicking directly on the canvas background
    if (e.target !== canvasRef.current) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert screen coordinates to canvas space (accounting for pan and zoom)
    const x = (clientX - pan.x) / zoom;
    const y = (clientY - pan.y) / zoom;

    // Offset note coordinate slightly so it is centered on cursor
    onAddNote({ x: x - 110, y: y - 90 });
  };

  // 3. Pan start handler
  const handleMouseDown = (e) => {
    // Only pan if clicking left button on the canvas background OR middle mouse button anywhere
    const isLeftClickOnBg = e.button === 0 && e.target === canvasRef.current;
    const isMiddleClick = e.button === 1;

    if (isLeftClickOnBg || isMiddleClick) {
      e.preventDefault();
      setIsPanning(true);
      
      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const startPanX = pan.x;
      const startPanY = pan.y;

      const handleMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startMouseX;
        const dy = moveEvent.clientY - startMouseY;
        setPan({
          x: startPanX + dx,
          y: startPanY + dy,
        });
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setIsPanning(false);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  // 4. Drag start handler for StickyNotes
  const handleNoteDragStart = (id, e) => {
    if (e.button !== 0) return; // Only drag with left click
    e.stopPropagation();
    e.preventDefault();

    const note = notes.find((n) => n.id === id);
    if (!note) return;

    setActiveDragId(id);
    document.body.classList.add('is-dragging-note');
    
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startNoteX = Number(note.x);
    const startNoteY = Number(note.y);

    // Set initial override state
    setDraggedNotesState((prev) => ({
      ...prev,
      [id]: { x: startNoteX, y: startNoteY },
    }));

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;
      const canvasDx = dx / zoom;
      const canvasDy = dy / zoom;

      const newX = startNoteX + canvasDx;
      const newY = startNoteY + canvasDy;

      setDraggedNotesState((prev) => ({
        ...prev,
        [id]: { x: newX, y: newY },
      }));

      // Bounding-box detection for Trash Bin
      const trashBin = document.getElementById('trash-bin-zone');
      if (trashBin) {
        const rect = trashBin.getBoundingClientRect();
        const isOver =
          moveEvent.clientX >= rect.left &&
          moveEvent.clientX <= rect.right &&
          moveEvent.clientY >= rect.top &&
          moveEvent.clientY <= rect.bottom;
        setIsOverTrash(isOver);
      }
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('is-dragging-note');

      const dx = upEvent.clientX - startMouseX;
      const dy = upEvent.clientY - startMouseY;
      const canvasDx = dx / zoom;
      const canvasDy = dy / zoom;
      
      const finalX = Math.round(startNoteX + canvasDx);
      const finalY = Math.round(startNoteY + canvasDy);

      let noteWasDeleted = false;
      const trashBin = document.getElementById('trash-bin-zone');
      if (trashBin) {
        const rect = trashBin.getBoundingClientRect();
        const isOver =
          upEvent.clientX >= rect.left &&
          upEvent.clientX <= rect.right &&
          upEvent.clientY >= rect.top &&
          upEvent.clientY <= rect.bottom;
        
        if (isOver) {
          onDeleteNote(id);
          noteWasDeleted = true;
        }
      }

      if (!noteWasDeleted) {
        onUpdateNote(id, {
          x: finalX,
          y: finalY,
        });
      }

      setActiveDragId(null);
      setIsOverTrash(false);
      setDraggedNotesState((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 5. Resize start handler for StickyNotes
  const handleNoteResizeStart = (id, e) => {
    if (e.button !== 0) return; // Only resize with left click
    e.stopPropagation();
    e.preventDefault();

    const note = notes.find((n) => n.id === id);
    if (!note) return;

    setActiveResizeId(id);
    document.body.classList.add('is-resizing-note');

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startWidth = Number(note.width) || 220;
    const startHeight = Number(note.height) || 180;

    setResizedNotesState((prev) => ({
      ...prev,
      [id]: {
        width: startWidth,
        height: startHeight,
      },
    }));

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;
      const canvasDx = dx / zoom;
      const canvasDy = dy / zoom;

      // Apply min bounds so note doesn't disappear
      const newWidth = Math.max(160, startWidth + canvasDx);
      const newHeight = Math.max(140, startHeight + canvasDy);

      setResizedNotesState((prev) => ({
        ...prev,
        [id]: { width: newWidth, height: newHeight },
      }));
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('is-resizing-note');

      const dx = upEvent.clientX - startMouseX;
      const dy = upEvent.clientY - startMouseY;
      const canvasDx = dx / zoom;
      const canvasDy = dy / zoom;

      const finalWidth = Math.max(160, Math.round(startWidth + canvasDx));
      const finalHeight = Math.max(140, Math.round(startHeight + canvasDy));

      onUpdateNote(id, {
        width: finalWidth,
        height: finalHeight,
      });

      setActiveResizeId(null);
      setResizedNotesState((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className={`whiteboard-container ${isPanning ? 'panning' : ''}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Infinite Canvas Content */}
      <div
        ref={canvasRef}
        className="whiteboard-canvas-grid"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
        }}
      >
        {/* Render Notes */}
        {notes.map((note) => {
          // Merge overrides
          const pos = draggedNotesState[note.id] || { x: note.x, y: note.y };
          const size = resizedNotesState[note.id] || {
            width: note.width || 220,
            height: note.height || 180,
          };
          
          const resolvedNote = {
            ...note,
            x: pos.x,
            y: pos.y,
            width: size.width,
            height: size.height,
          };

          return (
            <StickyNote
              key={note.id}
              note={resolvedNote}
              onDragStart={handleNoteDragStart}
              onResizeStart={handleNoteResizeStart}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
              currentUserId={nickname}
            />
          );
        })}
      </div>

      {/* Floating Instructions Banner */}
      <div className="canvas-instruction glassmorphism">
        💡 Double-click on any empty canvas area to add a note. Click & drag background to pan.
      </div>

      {/* Trash Bin drop zone */}
      <TrashBin isDragging={activeDragId !== null} isHovered={isOverTrash} />
    </div>
  );
}
