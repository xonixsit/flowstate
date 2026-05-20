import { useState, useEffect, useRef } from 'react';
import './index.css';
import './App.css';
import { Coffee, Brain, Eye, Shield, Sun, Flame, Settings2, Plus, X } from 'lucide-react';
import { initAudio, startSession, stopSession, setMode, waveformAnalyser } from './audioEngine';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundVisuals from './components/BackgroundVisuals';
import TimerDisplay from './components/TimerDisplay';
import KaizenDashboard from './components/KaizenDashboard';
import PathSettingsModal from './components/PathSettingsModal';
import { useKaizenTracker } from './hooks/useKaizenTracker';
import OnboardingFlow from './components/OnboardingFlow';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  // Kaizen Tracker State
  const tracker = useKaizenTracker();
  const activePath = tracker.activePath;
  const mode = activePath?.mode || 'focus';
  const [timerMinutes, setTimerMinutes] = useState(activePath?.defaultDuration || 15);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isPathModalOpen, setIsPathModalOpen] = useState(false);
  const [modalEditPath, setModalEditPath] = useState(null); // null = CREATE, path = EDIT
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [pendingReflection, setPendingReflection] = useState(null);
  const sessionStartRef = useRef(null);
  const addSessionTimeRef = useRef(tracker.addSessionTime);

  useEffect(() => {
    addSessionTimeRef.current = tracker.addSessionTime;
  }, [tracker.addSessionTime]);

  // Sync local timer minutes state with active path default duration
  useEffect(() => {
    if (activePath) {
      setTimerMinutes(activePath.defaultDuration);
    }
  }, [activePath]);

  const endCurrentSession = ({ showReflection = true } = {}) => {
    const startedAt = sessionStartRef.current || sessionStartTime;
    if (startedAt) {
      const elapsedMs = Date.now() - startedAt;
      const elapsedMinutes = elapsedMs / 60000;
      addSessionTimeRef.current(elapsedMinutes);
      if (showReflection && elapsedMinutes >= 0.1) {
        setPendingReflection({
          pathId: activePath?.id,
          pathName: activePath?.name || 'FlowState Session',
          mode,
          minutes: elapsedMinutes,
          completedAt: new Date().toISOString()
        });
      }
      sessionStartRef.current = null;
      setSessionStartTime(null);
    }
  };

  const handleToggle = async () => {
    if (!isPlaying) {
      await initAudio();
      setMode(mode);
      startSession();
      const startedAt = Date.now();
      sessionStartRef.current = startedAt;
      setSessionStartTime(startedAt);
      setIsPlaying(true);
    } else {
      stopSession();
      endCurrentSession();
      setIsPlaying(false);
    }
  };

  const handlePathSelect = (pathId) => {
    if (isPlaying) {
      stopSession();
      endCurrentSession();
      setIsPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    tracker.selectPath(pathId);
  };

  const handlePathModalSubmit = (name, pathMode, defaultDur) => {
    if (isPlaying) {
      stopSession();
      endCurrentSession();
      setIsPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    if (modalEditPath) {
      tracker.editPath(modalEditPath.id, name, pathMode, defaultDur);
    } else {
      tracker.createPath(name, pathMode, defaultDur);
    }
  };

  const handleOpenCreateModal = () => {
    setModalEditPath(null);
    setIsPathModalOpen(true);
  };

  const handleDurationUpdate = (minutes) => {
    setTimerMinutes(minutes);
    if (activePath) {
      tracker.updatePathDuration(activePath.id, minutes);
    }
  };

  const getModeColor = (m) => {
    switch (m) {
      case 'focus': return '#8a2be2';
      case 'break': return '#ff69b4';
      case 'meditate': return '#00bfff';
      case 'detox': return '#2ecc71';
      case 'awaken': return '#f59e0b';
      default: return '#00bfff';
    }
  };

  const getModeIcon = (m) => {
    switch (m) {
      case 'focus': return Brain;
      case 'break': return Coffee;
      case 'meditate': return Eye;
      case 'detox': return Shield;
      case 'awaken': return Sun;
      default: return Brain;
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const totalMs = timerMinutes * 60 * 1000;
    timerRef.current = setTimeout(() => {
      stopSession();
      endCurrentSession();
      setIsPlaying(false);
    }, totalMs);
  };

  const handleReflectionSubmit = (rating, label) => {
    if (pendingReflection) {
      tracker.addSessionReflection({
        ...pendingReflection,
        rating,
        label
      });
    }
    setPendingReflection(null);
  };



  // Visualiser using Tone.Analyser
  useEffect(() => {
    let animationId;
    const drawWaveform = () => {
      animationId = requestAnimationFrame(drawWaveform);
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      
      // Dynamic gradient based on mode
      let color1, color2;
      if (mode === 'focus') { color1 = '#8a2be2'; color2 = '#ff69b4'; }
      else if (mode === 'break') { color1 = '#ff69b4'; color2 = '#00bfff'; }
      else if (mode === 'meditate') { color1 = '#00bfff'; color2 = '#e0e0ff'; }
      else if (mode === 'detox') { color1 = '#2ecc71'; color2 = '#00bfff'; }
      else if (mode === 'awaken') { color1 = '#f59e0b'; color2 = '#ff69b4'; }
      else { color1 = '#38bdf8'; color2 = '#818cf8'; }

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(0.5, '#ffffff'); // Glossy shine in the middle
      gradient.addColorStop(1, color2);

      ctx.beginPath();
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;

      if (isPlaying && waveformAnalyser) {
        const values = waveformAnalyser.getValue();
        // Glossy glow effect
        ctx.shadowBlur = 12;
        ctx.shadowColor = color1;
        for (let i = 0; i < values.length; i++) {
          const x = width * (i / (values.length - 1));
          const y = ((values[i] + 1) / 2) * height;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      } else {
        // Calm breathing wave when inactive
        ctx.shadowBlur = 8;
        ctx.shadowColor = color1;
        const time = Date.now() * 0.002;
        for (let x = 0; x < width; x++) {
          const y = (height / 2) + Math.sin(x * 0.03 + time) * 3;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Reset shadow to avoid compounding on clearRect
      ctx.shadowBlur = 0;
    };
    drawWaveform();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, mode]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (sessionStartRef.current) {
         const elapsedMs = Date.now() - sessionStartRef.current;
         addSessionTimeRef.current(elapsedMs / 60000);
      }
    };
  }, []);

  // Loading Screen: wait for native SQLite database initialization to complete
  if (!tracker.isStorageReady) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Initializing FlowState...</p>
        </div>
      </div>
    );
  }

  // Onboarding Screen: direct new users to personalize their profile & first training path
  if (!tracker.profile.isOnboarded) {
    return <OnboardingFlow onComplete={tracker.completeOnboarding} />;
  }

  return (
    <div className="app-container">
      <header className="header-logo">
        <h1>FlowState</h1>
      </header>

      {/* Kaizen Stats Button */}
      <button 
        className="stats-btn"
        onClick={() => setIsDashboardOpen(true)}
      >
        <Flame size={20} color={tracker.currentStreak > 0 ? '#f59e0b' : '#a0a0c0'} />
        {tracker.currentStreak > 0 && <span className="streak-count">{tracker.currentStreak}</span>}
      </button>

      <KaizenDashboard 
        tracker={tracker} 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
      />

      <PathSettingsModal
        isOpen={isPathModalOpen}
        onClose={() => setIsPathModalOpen(false)}
        onSubmit={handlePathModalSubmit}
        onDelete={tracker.deletePath}
        path={modalEditPath}
      />

      <AnimatePresence>
        {pendingReflection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.62)',
              backdropFilter: 'blur(14px)',
              zIndex: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 18, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 18, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '380px',
                background: 'rgba(15, 15, 28, 0.96)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '22px',
                padding: '1.5rem',
                boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setPendingReflection(null)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#a0a0c0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>

              <div style={{ paddingRight: '2rem' }}>
                <div style={{ color: getModeColor(pendingReflection.mode), fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.4px' }}>
                  {Math.max(1, Math.round(pendingReflection.minutes))} min logged
                </div>
                <h3 style={{ color: '#fff', fontSize: '1.35rem', margin: '0.35rem 0 0.25rem', fontWeight: 900 }}>
                  How was your focus?
                </h3>
                <p style={{ color: '#a0a0c0', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  A quick reflection helps FlowState learn which paths actually work for you.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem', marginTop: '1.2rem' }}>
                {[
                  { rating: 5, label: 'Locked in' },
                  { rating: 4, label: 'Steady' },
                  { rating: 3, label: 'Mixed' },
                  { rating: 2, label: 'Restless' }
                ].map(option => (
                  <button
                    key={option.rating}
                    onClick={() => handleReflectionSubmit(option.rating, option.label)}
                    style={{
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      borderRadius: '14px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontWeight: 800
                    }}
                  >
                    <span>{option.label}</span>
                    <span style={{ color: getModeColor(pendingReflection.mode), fontSize: '0.8rem' }}>{option.rating}/5</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Ambient Background Glow Blob */}
      <div 
        style={{
          position: 'fixed',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${getModeColor(mode)}18 0%, transparent 65%)`,
          filter: 'blur(70px)',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
          pointerEvents: 'none',
          transition: 'background 1s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      />

      <BackgroundVisuals mode={mode} isPlaying={isPlaying} />

      <main className="main-content" style={{ zIndex: 1 }}>
        {/* 1. Immersive Center Paths Gallery */}
        <div className="paths-gallery">
          {tracker.paths.map(path => {
            const isSelected = path.id === tracker.selectedPathId;
            const Icon = getModeIcon(path.mode);
            const color = getModeColor(path.mode);

            return (
              <motion.div
                key={path.id}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePathSelect(path.id)}
                className={`gallery-card ${isSelected ? 'active' : ''}`}
                style={{
                  width: '135px',
                  height: '135px',
                  background: isSelected ? `${color}12` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '22px',
                  padding: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  boxShadow: isSelected ? `0 12px 30px ${color}20` : 'none',
                  transition: 'border 0.3s, background 0.3s'
                }}
              >
                {/* Streak Badge */}
                {path.currentStreak > 0 && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    🔥 {path.currentStreak}
                  </div>
                )}

                {/* Mode Icon */}
                <div 
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: color, border: `1px solid ${color}20`
                  }}
                >
                  <Icon size={16} />
                </div>

                {/* Path Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', paddingRight: '15px' }}>
                  <span 
                    style={{
                      color: '#fff', fontSize: '0.9rem', fontWeight: 800,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}
                  >
                    {path.name}
                  </span>
                  <span style={{ color: '#a0a0c0', fontSize: '0.75rem' }}>
                    Goal: {path.defaultDuration}m
                  </span>
                </div>

                {/* Tiny Edit Settings Gear Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalEditPath(path);
                    setIsPathModalOpen(true);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  <Settings2 size={13} />
                </button>
              </motion.div>
            );
          })}

          {/* Centered Add Path Option Card */}
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenCreateModal}
            className="gallery-card add-card"
            style={{
              width: '135px',
              height: '135px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed rgba(255,255,255,0.18)',
              borderRadius: '22px',
              padding: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#a0a0c0',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
              {tracker.paths.length > 1 ? 'Add Another' : 'Add Path'}
            </span>
          </motion.div>
        </div>

        {/* 2. Bottom-Docked Symmetrical Compact Player Deck */}
        <motion.div 
          className={`card compact-player ${mode} ${isPlaying ? 'active-card' : ''}`}
          style={{
            flexDirection: 'column',
            padding: '2rem 1.8rem',
            width: '100%',
            maxWidth: '420px',
            boxShadow: `0 24px 60px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 40px ${getModeColor(mode)}12`,
            borderColor: `${getModeColor(mode)}30`,
            background: 'rgba(255,255,255,0.01)',
            gap: '1.5rem',
            alignItems: 'center'
          }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Path Header Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', gap: '0.3rem' }}>
            <span style={{ 
              fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', 
              color: getModeColor(mode), background: `${getModeColor(mode)}15`, 
              padding: '0.2rem 0.7rem', borderRadius: '20px', border: `1px solid ${getModeColor(mode)}30`
            }}>
              {mode} Path
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
              {activePath?.name}
            </h2>
          </div>

          {/* Breathing wave canvas */}
          <div className="canvas-container visible" style={{ opacity: 1, height: '50px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <canvas ref={canvasRef} width="350" height="50" className="waveform-canvas" />
          </div>

          {/* Player Controls */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <TimerDisplay 
              timerMinutes={timerMinutes}
              setTimerMinutes={handleDurationUpdate}
              isPlaying={isPlaying}
              mode={mode}
              handleToggle={handleToggle}
              startTimer={startTimer}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}


export default App;
