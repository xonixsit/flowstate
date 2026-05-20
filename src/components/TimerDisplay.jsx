import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square } from 'lucide-react';

export default function TimerDisplay({ 
  timerMinutes, 
  setTimerMinutes, 
  isPlaying, 
  mode,
  handleToggle,
  startTimer
}) {
  const [timeLeft, setTimeLeft] = useState(timerMinutes * 60);

  // Sync timeLeft when timerMinutes change (only when not playing)
  useEffect(() => {
    if (!isPlaying) {
      setTimeLeft(timerMinutes * 60);
    }
  }, [timerMinutes, isPlaying]);

  // Countdown logic
  useEffect(() => {
    let interval;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getThemeColor = () => {
    if (mode === 'focus') return '#8a2be2';
    if (mode === 'break') return '#ff69b4';
    if (mode === 'meditate') return '#00bfff';
    if (mode === 'detox') return '#2ecc71';
    if (mode === 'awaken') return '#f59e0b';
    return '#38bdf8';
  };

  const color = getThemeColor();
  const totalSeconds = timerMinutes * 60;
  const progress = isPlaying ? timeLeft / totalSeconds : 1;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      
      {/* Play Button with Progress Ring */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
          <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <motion.circle
            cx="40" cy="40" r={radius} fill="transparent"
            stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: circumference - progress * circumference }}
            transition={{ duration: 1, ease: 'linear' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        
        <button
          onClick={() => {
            handleToggle();
            if (!isPlaying) startTimer();
          }}
          style={{
            position: 'absolute', top: '10px', left: '10px',
            width: '60px', height: '60px', borderRadius: '50%',
            background: color, border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: `0 4px 15px ${color}80`,
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isPlaying ? <Square fill="#fff" size={24} /> : <Play fill="#fff" size={24} style={{ marginLeft: '4px' }} />}
        </button>
      </div>

      {/* Digital Time Display / Input */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {!isPlaying ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
            <input
              type="number" min="1" max="60"
              value={timerMinutes} onChange={(e) => setTimerMinutes(Number(e.target.value))}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-primary)',
                fontSize: '2rem', fontWeight: 700, width: '60px', outline: 'none',
                textShadow: `0 0 10px ${color}`
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>min</span>
          </div>
        ) : (
          <div style={{
            color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 700,
            textShadow: `0 0 10px ${color}`, letterSpacing: '2px'
          }}>
            {formatTime(timeLeft)}
          </div>
        )}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {isPlaying ? 'Remaining' : 'Set Timer'}
        </div>
      </div>
      
    </div>
  );
}
