import { useState, useEffect } from 'react';

const STORAGE_KEY = 'flowstate_kaizen_data';

const getTodayDateString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const getYesterdayDateString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const getInitialData = () => {
  const defaultData = {
    currentStreak: 0,
    lastActiveDate: null,
    history: {}
  };
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error parsing localStorage", e);
  }
  return defaultData;
};

export function useKaizenTracker() {
  const [data, setData] = useState(getInitialData);

  // Initialize and check streak on mount
  useEffect(() => {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    
    setData(prev => {
      let newStreak = prev.currentStreak;
      
      if (prev.lastActiveDate !== today) {
        // If they missed yesterday, streak resets to 0 (until they do a session today)
        if (prev.lastActiveDate !== yesterday && prev.lastActiveDate !== null) {
          newStreak = 0;
        }
      }
      
      const newData = { ...prev, currentStreak: newStreak };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  const addSessionTime = (minutesToAdd) => {
    if (minutesToAdd <= 0) return;
    
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    
    setData(prev => {
      let newStreak = prev.currentStreak;
      
      // If this is the first session today, increment streak
      if (prev.lastActiveDate !== today) {
        if (prev.lastActiveDate === yesterday || prev.lastActiveDate === null || newStreak === 0) {
          newStreak += 1;
        } else {
          // If they missed days, it resets to 1 today
          newStreak = 1;
        }
      }

      const todayTotal = (prev.history[today] || 0) + minutesToAdd;
      
      const newData = {
        currentStreak: newStreak,
        lastActiveDate: today,
        history: {
          ...prev.history,
          [today]: todayTotal
        }
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  
  const todayMinutes = data.history[today] || 0;
  const yesterdayMinutes = data.history[yesterday] || 0;
  
  // Kaizen Goal: 1% better than yesterday, or at least 5 minutes if yesterday was 0
  const kaizenGoal = yesterdayMinutes > 0 ? Math.ceil(yesterdayMinutes * 1.05) : 5; // 5% better makes it slightly more achievable but noticeable
  const progress = Math.min((todayMinutes / kaizenGoal) * 100, 100);
  const isGoalMet = todayMinutes >= kaizenGoal;

  return {
    currentStreak: data.currentStreak,
    todayMinutes,
    yesterdayMinutes,
    kaizenGoal,
    progress,
    isGoalMet,
    addSessionTime
  };
}
