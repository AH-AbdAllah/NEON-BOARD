import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Whiteboard from './components/Whiteboard';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'board'
  const [nickname, setNickname] = useState('');
  const [notes, setNotes] = useState([]);
  const [isDisconnected, setIsDisconnected] = useState(false);

  // Theme Management: 'adaptive' | 'light' | 'dark'
  const [themeMode, setThemeMode] = useState(() => {
    const stored = localStorage.getItem('whiteboard_theme_mode');
    return stored === 'light' || stored === 'dark' ? stored : 'adaptive';
  });

  // Apply resolved theme attribute to HTML tag
  useEffect(() => {
    const applyTheme = () => {
      let resolvedTheme = themeMode;
      if (themeMode === 'adaptive') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = systemPrefersDark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    applyTheme();

    if (themeMode === 'adaptive') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [themeMode]);

  const handleCycleTheme = () => {
    let nextMode;
    if (themeMode === 'adaptive') {
      nextMode = 'light';
    } else if (themeMode === 'light') {
      nextMode = 'dark';
    } else {
      nextMode = 'adaptive';
    }
    setThemeMode(nextMode);
    localStorage.setItem('whiteboard_theme_mode', nextMode);
  };

  // Center the 50000x50000 canvas relative to viewport size
  const getInitialPan = () => ({
    x: window.innerWidth / 2 - 25000,
    y: window.innerHeight / 2 - 25000,
  });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(getInitialPan());

  // Track window resizing to adjust centered viewport coordinates
  useEffect(() => {
    const handleResize = () => {
      setPan((prevPan) => prevPan);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set up SSE EventSource connection when entering whiteboard view
  useEffect(() => {
    if (view !== 'board') return;

    const eventSource = new EventSource('/api/notes/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          // Explicitly cast coordinates and dimensions to Numbers
          const parsedNotes = data.map(note => ({
            ...note,
            x: Number(note.x),
            y: Number(note.y),
            width: Number(note.width) || 220,
            height: Number(note.height) || 180
          }));
          setNotes(parsedNotes);
        }
        setIsDisconnected(false);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsDisconnected(true);
    };

    return () => {
      console.log('Closing SSE connection.');
      eventSource.close();
    };
  }, [view]);

  const handleLaunch = (name) => {
    setNickname(name);
    setView('board');
    // Reset view position on launch
    setZoom(1);
    setPan(getInitialPan());
  };

  const handleBackToLanding = () => {
    setView('landing');
    setNotes([]);
  };

  // REST API: Add note
  const handleAddNote = async ({ x, y }) => {
    const newNote = {
      content: '',
      color: 'neon-green',
      x: Math.round(x),
      y: Math.round(y),
      width: 220,
      height: 180,
      lastEditedBy: nickname || 'Anonymous',
    };

    // Optimistic temporary update (will be overwritten by Firestore)
    const tempId = `temp-${Date.now()}`;
    setNotes((prev) => [...prev, { id: tempId, ...newNote }]);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
      if (!response.ok) {
        throw new Error('Failed to create note on server');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      // Remove optimistic note if failed
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
    }
  };

  // REST API: Update note
  const handleUpdateNote = async (id, fields) => {
    // Optimistic update locally
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.id === id ? { ...n, ...fields, lastEditedBy: nickname } : n))
    );

    const originalNote = notes.find((n) => n.id === id);
    if (!originalNote) return;

    const payload = {
      id,
      content: fields.content !== undefined ? fields.content : originalNote.content,
      color: fields.color !== undefined ? fields.color : originalNote.color,
      x: fields.x !== undefined ? Math.round(fields.x) : Math.round(originalNote.x),
      y: fields.y !== undefined ? Math.round(fields.y) : Math.round(originalNote.y),
      width: fields.width !== undefined ? Math.round(fields.width) : Math.round(originalNote.width || 220),
      height: fields.height !== undefined ? Math.round(fields.height) : Math.round(originalNote.height || 180),
      lastEditedBy: nickname || 'Anonymous',
    };

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to update note on server');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      // Revert position/content/dimensions on error
      setNotes((prevNotes) =>
        prevNotes.map((n) => (n.id === id ? originalNote : n))
      );
    }
  };

  // REST API: Delete note
  const handleDeleteNote = async (id) => {
    // Optimistic delete locally
    const originalNotes = [...notes];
    setNotes((prevNotes) => prevNotes.filter((n) => n.id !== id));

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete note on server');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      // Revert deletion on error
      setNotes(originalNotes);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {view === 'landing' ? (
        <LandingPage 
          onLaunch={handleLaunch} 
          themeMode={themeMode}
          onCycleTheme={handleCycleTheme}
        />
      ) : (
        <>
          <Header
            nickname={nickname}
            onBack={handleBackToLanding}
            zoom={zoom}
            setZoom={setZoom}
            setPan={setPan}
            notesCount={notes.filter((n) => !n.id.startsWith('temp-')).length}
            isDisconnected={isDisconnected}
            themeMode={themeMode}
            onCycleTheme={handleCycleTheme}
          />
          <Whiteboard
            notes={notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            nickname={nickname}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
          />
        </>
      )}
    </div>
  );
}
