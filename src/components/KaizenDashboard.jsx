import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, Clock, X, Trophy } from 'lucide-react';

export default function KaizenDashboard({ tracker, isOpen, onClose }) {
  const { currentStreak, todayMinutes, yesterdayMinutes, kaizenGoal, progress, isGoalMet } = tracker;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              background: 'rgba(20, 20, 35, 0.85)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '24px',
              padding: '2rem',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '15px', right: '15px',
                background: 'transparent', border: 'none', color: '#a0a0c0', cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(45deg, #f59e0b, #ff69b4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kaizen Tracker
              </h2>
              <p style={{ color: '#a0a0c0', fontSize: '0.9rem', marginTop: '0.5rem' }}>1% Better Every Day</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              
              {/* Streak Card */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <Flame size={28} color="#f59e0b" style={{ margin: '0 auto', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{currentStreak}</div>
                <div style={{ fontSize: '0.8rem', color: '#a0a0c0', textTransform: 'uppercase' }}>Day Streak</div>
              </div>

              {/* Time Card */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(0, 191, 255, 0.2)' }}>
                <Clock size={28} color="#00bfff" style={{ margin: '0 auto', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{Math.floor(todayMinutes)}<span style={{fontSize: '1rem', color: '#a0a0c0'}}>m</span></div>
                <div style={{ fontSize: '0.8rem', color: '#a0a0c0', textTransform: 'uppercase' }}>Today</div>
              </div>
            </div>

            {/* Kaizen Goal Section */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '1.5rem', border: `1px solid ${isGoalMet ? 'rgba(46, 204, 113, 0.4)' : 'rgba(255,255,255,0.1)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} color={isGoalMet ? '#2ecc71' : '#ff69b4'} />
                  <span style={{ fontWeight: 600, color: '#fff' }}>Daily Goal</span>
                </div>
                <div style={{ fontWeight: 800, color: isGoalMet ? '#2ecc71' : '#fff' }}>
                  {Math.floor(todayMinutes)} / {kaizenGoal}m
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: isGoalMet ? '#2ecc71' : 'linear-gradient(90deg, #ff69b4, #00bfff)',
                    borderRadius: '10px',
                    boxShadow: isGoalMet ? '0 0 10px #2ecc71' : 'none'
                  }}
                />
              </div>
              
              {isGoalMet && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2ecc71', fontSize: '0.9rem', justifyContent: 'center' }}
                >
                  <Trophy size={16} />
                  <span>You beat yesterday! Kaizen achieved.</span>
                </motion.div>
              )}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
