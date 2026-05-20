import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, Clock, X, Trophy, BarChart2, Calendar, Target, Activity, Download, Upload } from 'lucide-react';

export default function KaizenDashboard({ tracker, isOpen, onClose }) {
  const restoreInputRef = useRef(null);
  const [backupStatus, setBackupStatus] = useState('');
  const { 
    activePath,
    currentStreak, 
    todayMinutes, 
    yesterdayMinutes, 
    totalMinutes, 
    favoriteMode, 
    averageFocusRating,
    recentReflections,
    weeklyTotalMinutes,
    activeDaysThisWeek,
    consistencyScore,
    bestDay,
    dashboardInsight,
    sevenDayHistory, 
    kaizenGoal, 
    progress, 
    isGoalMet 
  } = tracker;

  // Format today's date nicely
  const getFormattedDate = () => {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  // Format total minutes into "Xh Ym" or "Ym"
  const formatTotalTime = (mins) => {
    if (mins < 1) return "< 1m";
    const hours = Math.floor(mins / 60);
    const remainingMins = Math.floor(mins % 60);
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${remainingMins}m`;
  };

  // Find max minutes in 7-day history to scale the bar chart properly
  const maxSevenDayMins = Math.max(...sevenDayHistory.map(day => day.minutes), 5);

  const handleExport = () => {
    const backup = tracker.createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `flowstate-backup-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setBackupStatus('Backup exported');
  };

  const handleRestoreFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await tracker.restoreBackup(parsed);
      setBackupStatus('Backup restored');
    } catch (error) {
      console.error('Failed to restore FlowState backup:', error);
      setBackupStatus('Restore failed');
    } finally {
      event.target.value = '';
    }
  };

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
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(16px)',
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
              background: 'rgba(15, 15, 28, 0.9)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '28px',
              padding: '2rem',
              width: '100%',
              maxWidth: '430px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
              overflowY: 'auto',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'transparent', border: 'none', color: '#a0a0c0', cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0c0'}
            >
              <X size={24} />
            </button>

            {/* Profile Greeting & Header Section */}
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#818cf8', marginBottom: '0.2rem' }}>
                {activePath?.name || 'Kaizen Path'}
              </div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                Hello, {tracker.profile?.username || 'Focus User'}!
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#a0a0c0', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                <Calendar size={14} />
                <span>{getFormattedDate()}</span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Streak Card */}
              <div style={{ background: 'rgba(255, 158, 11, 0.05)', borderRadius: '20px', padding: '1.2rem 1rem', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <Flame size={26} color="#f59e0b" style={{ margin: '0 auto', marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{currentStreak}</div>
                <div style={{ fontSize: '0.75rem', color: '#a0a0c0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.4rem' }}>Day Streak</div>
              </div>

              {/* Today's Duration */}
              <div style={{ background: 'rgba(0, 191, 255, 0.05)', borderRadius: '20px', padding: '1.2rem 1rem', textAlign: 'center', border: '1px solid rgba(0, 191, 255, 0.15)' }}>
                <Clock size={26} color="#00bfff" style={{ margin: '0 auto', marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {Math.floor(todayMinutes)}<span style={{fontSize: '1rem', color: '#a0a0c0', fontWeight: 500}}>m</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a0a0c0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.4rem' }}>Today's Time</div>
              </div>
            </div>

            {/* Lifetime & Favorites Rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#a0a0c0' }}>Total Focused</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                  {formatTotalTime(totalMinutes)}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.8rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#a0a0c0' }}>Favorite Mode</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                  {favoriteMode}
                </div>
              </div>
            </div>

            {/* Weekly Review */}
            <div style={{ background: 'rgba(129, 140, 248, 0.06)', borderRadius: '20px', padding: '1.1rem', border: '1px solid rgba(129, 140, 248, 0.14)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '0.9rem', fontWeight: 800 }}>
                  <Activity size={17} color="#818cf8" />
                  <span>Weekly Review</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 900, background: 'rgba(129, 140, 248, 0.12)', borderRadius: '999px', padding: '0.25rem 0.6rem' }}>
                  {consistencyScore}% steady
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.22)', borderRadius: '14px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#a0a0c0' }}>Week</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginTop: '0.15rem' }}>{formatTotalTime(weeklyTotalMinutes)}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.22)', borderRadius: '14px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#a0a0c0' }}>Active</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginTop: '0.15rem' }}>{activeDaysThisWeek}/7 days</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.22)', borderRadius: '14px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#a0a0c0' }}>Best</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginTop: '0.15rem' }}>{Math.floor(bestDay?.minutes || 0)}m</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', color: '#c7d2fe', fontSize: '0.78rem', lineHeight: 1.45, background: 'rgba(0,0,0,0.18)', borderRadius: '14px', padding: '0.75rem', border: '1px solid rgba(129, 140, 248, 0.1)' }}>
                <Target size={15} color="#818cf8" style={{ flex: 'none', marginTop: '0.1rem' }} />
                <span>{dashboardInsight}</span>
              </div>
            </div>

            {/* Reflection Signal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', background: 'rgba(255,255,255,0.025)', padding: '1rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#a0a0c0' }}>Focus Quality</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                  {averageFocusRating > 0 ? `${averageFocusRating.toFixed(1)} / 5` : 'No data'}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.8rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#a0a0c0' }}>Last Check-In</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                  {recentReflections?.[0]?.label || 'Not yet'}
                </div>
              </div>
            </div>

            {/* Backup Controls */}
            <div style={{ background: 'rgba(255,255,255,0.025)', borderRadius: '18px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 850, color: '#fff' }}>Local Backup</div>
                  <div style={{ fontSize: '0.72rem', color: '#a0a0c0', marginTop: '0.15rem' }}>Export or restore your private progress file.</div>
                </div>
                {backupStatus && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: backupStatus.includes('failed') ? '#ff69b4' : '#2ecc71' }}>
                    {backupStatus}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={handleExport}
                  style={{
                    border: '1px solid rgba(46, 204, 113, 0.18)',
                    background: 'rgba(46, 204, 113, 0.08)',
                    color: '#fff',
                    borderRadius: '13px',
                    padding: '0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                  <span>Export</span>
                </button>
                <button
                  type="button"
                  onClick={() => restoreInputRef.current?.click()}
                  style={{
                    border: '1px solid rgba(129, 140, 248, 0.2)',
                    background: 'rgba(129, 140, 248, 0.08)',
                    color: '#fff',
                    borderRadius: '13px',
                    padding: '0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={15} />
                  <span>Restore</span>
                </button>
              </div>
              <input
                ref={restoreInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleRestoreFile}
                style={{ display: 'none' }}
              />
            </div>

            {/* SQLite User Profile Card */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '20px', 
              padding: '1.1rem', 
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.2rem' }}>
                <span style={{ fontWeight: 800, color: '#818cf8', letterSpacing: '0.3px' }}>SQLite User Details</span>
                <span style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 800, background: 'rgba(129, 140, 248, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>Local Sync</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0a0c0' }}>Display Name:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{tracker.profile?.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0a0c0' }}>Registered Email:</span>
                <span style={{ fontWeight: 600, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '200px', whiteSpace: 'nowrap' }}>
                  {tracker.profile?.email || 'N/A (Local-Only)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0a0c0' }}>Training Since:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>
                  {tracker.profile?.createdAt ? new Date(tracker.profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Kaizen Goal Section */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '1.2rem', border: `1px solid ${isGoalMet ? 'rgba(46, 204, 113, 0.25)' : 'rgba(255,255,255,0.06)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color={isGoalMet ? '#2ecc71' : '#ff69b4'} />
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Kaizen Goal</span>
                </div>
                <div style={{ fontWeight: 800, color: isGoalMet ? '#2ecc71' : '#fff', fontSize: '0.95rem' }}>
                  {Math.floor(todayMinutes)} / {kaizenGoal}m
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: isGoalMet ? '#2ecc71' : 'linear-gradient(90deg, #ff69b4, #00bfff)',
                    borderRadius: '10px',
                    boxShadow: isGoalMet ? '0 0 10px rgba(46, 204, 113, 0.5)' : 'none'
                  }}
                />
              </div>
              
              {isGoalMet ? (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2ecc71', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  <Trophy size={14} />
                  <span>1% Better Achieved! You beat yesterday.</span>
                </motion.div>
              ) : (
                <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: '#a0a0c0', textAlign: 'center' }}>
                  {yesterdayMinutes > 0 
                    ? `Focus for ${kaizenGoal - Math.floor(todayMinutes)} more minutes to beat yesterday!`
                    : "Complete a 5-minute session today to launch your Kaizen streak!"
                  }
                </div>
              )}
            </div>

            {/* 7-Day Analytics Bar Chart */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '20px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.2rem', color: '#fff' }}>
                <BarChart2 size={18} color="#00bfff" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Last 7 Days (m)</span>
              </div>

              {/* Chart Grid */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '110px', padding: '0 0.5rem' }}>
                {sevenDayHistory.map((day, index) => {
                  const barHeight = (day.minutes / maxSevenDayMins) * 80; // scale up to max 80px
                  const isToday = index === 6;
                  
                  return (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      {/* Bar Value Indicator */}
                      <span style={{ fontSize: '0.7rem', color: day.minutes > 0 ? '#fff' : 'transparent', marginBottom: '0.2rem', fontWeight: 600 }}>
                        {Math.floor(day.minutes)}
                      </span>
                      {/* Bar Graphic */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(barHeight, 4)}px` }} // Min 4px height for visibility
                        transition={{ delay: index * 0.05, duration: 0.8, ease: 'easeOut' }}
                        style={{
                          width: '16px',
                          background: day.minutes === 0 
                            ? 'rgba(255,255,255,0.08)' 
                            : isToday 
                              ? 'linear-gradient(180deg, #00bfff, #8a2be2)'
                              : 'linear-gradient(180deg, #ff69b4, rgba(138, 43, 226, 0.4))',
                          borderRadius: '8px 8px 0 0',
                          border: isToday ? '1px solid rgba(0, 191, 255, 0.6)' : 'none'
                        }}
                      />
                      {/* X-Axis Date Label */}
                      <span style={{ fontSize: '0.65rem', color: isToday ? '#fff' : '#a0a0c0', marginTop: '0.4rem', fontWeight: isToday ? 700 : 400 }}>
                        {day.label.split(' ')[1]} {/* Just show the day number to fit */}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
