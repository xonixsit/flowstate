import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import './App.css';
import { Play, Square, Coffee, Brain, Eye, Shield, Sun } from 'lucide-react';
import { initAudio, startSession, stopSession, setMode, waveformAnalyser } from './audioEngine';
import { motion } from 'framer-motion';
import BackgroundVisuals from './components/BackgroundVisuals';
import TimerDisplay from './components/TimerDisplay';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setSessionMode] = useState('focus'); // 'focus' | 'break' | 'meditate'
  const canvasRef = useRef(null);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const timerRef = useRef(null);

  const handleToggle = async () => {
    if (!isPlaying) {
      await initAudio();
      setMode(mode);
      startSession();
      setIsPlaying(true);
    } else {
      stopSession();
      setIsPlaying(false);
    }
  };

  const handleModeSwitch = (newMode) => {
    if (isPlaying) {
      stopSession();
      setIsPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    setSessionMode(newMode);
  };

  // Countdown timer that automatically stops the session
  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const totalMs = timerMinutes * 60 * 1000;
    timerRef.current = setTimeout(() => {
      stopSession();
      setIsPlaying(false);
    }, totalMs);
  };



  // Visualiser using Tone.Analyser
  useEffect(() => {
    let animationId;
    const drawWaveform = () => {
      animationId = requestAnimationFrame(drawWaveform);
      if (!isPlaying || !waveformAnalyser || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const values = waveformAnalyser.getValue();
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
      
      // Glossy glow effect
      ctx.shadowBlur = 12;
      ctx.shadowColor = color1;

      for (let i = 0; i < values.length; i++) {
        const x = width * (i / (values.length - 1));
        const y = ((values[i] + 1) / 2) * height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
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
    };
  }, []);

  return (
    <div className="app-container">
      <header className="header-logo">
        <h1>FlowState</h1>
      </header>

      <BackgroundVisuals mode={mode} isPlaying={isPlaying} />

      <main className="main-content">
        <motion.div 
          className={`card compact-player ${mode} ${isPlaying ? 'active-card' : ''}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="player-left">
            <TimerDisplay 
              timerMinutes={timerMinutes}
              setTimerMinutes={setTimerMinutes}
              isPlaying={isPlaying}
              mode={mode}
              handleToggle={handleToggle}
              startTimer={startTimer}
            />
          </div>

          <div className="player-center">
            <div className={`canvas-container ${isPlaying ? 'visible' : 'hidden'}`}>
              <canvas ref={canvasRef} width="400" height="50" className="waveform-canvas" />
            </div>
            
            <div className="mode-selector">
              <button
                className={`mode-btn focus ${mode === 'focus' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('focus')}
              >
                <Brain size={18} /> Focus
              </button>
              <button
                className={`mode-btn break ${mode === 'break' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('break')}
              >
                <Coffee size={18} /> Break
              </button>
              <button
                className={`mode-btn meditate ${mode === 'meditate' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('meditate')}
              >
                <Eye size={18} /> Meditate
              </button>
              <button
                className={`mode-btn detox ${mode === 'detox' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('detox')}
              >
                <Shield size={18} /> Detox
              </button>
              <button
                className={`mode-btn awaken ${mode === 'awaken' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('awaken')}
              >
                <Sun size={18} /> Awaken
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}


export default App;
