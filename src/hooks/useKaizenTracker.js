import { useState, useEffect } from 'react';
import { getSQLiteValue, setSQLiteValue } from '../utils/sqliteService';

const STORAGE_KEY = 'flowstate_kaizen_paths_data';
const BACKUP_VERSION = 1;

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
  const defaultPath = {
    id: 'default-path',
    name: 'My Daily Flow',
    mode: 'focus',
    defaultDuration: 15,
    currentStreak: 0,
    lastActiveDate: null,
    history: {}
  };

  const defaultSchema = {
    selectedPathId: 'default-path',
    paths: [defaultPath],
    reflections: [],
    profile: {
      username: '',
      email: '',
      isOnboarded: false,
      createdAt: new Date().toISOString()
    }
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Backwards Compatibility: If profile is missing but they have history,
      // auto-onboard them so we don't disrupt their experience.
      if (!parsed.profile) {
        parsed.profile = {
          username: 'Focus User',
          email: '',
          isOnboarded: true,
          createdAt: new Date().toISOString()
        };
      }
      if (!Array.isArray(parsed.reflections)) {
        parsed.reflections = [];
      }
      return parsed;
    }

    // Schema Migration from Old Global Tracker
    const oldSaved = localStorage.getItem('flowstate_kaizen_data');
    if (oldSaved) {
      const oldData = JSON.parse(oldSaved);
      // Migrate old global streak/history into the default path
      const migratedPath = {
        ...defaultPath,
        currentStreak: oldData.currentStreak || 0,
        lastActiveDate: oldData.lastActiveDate || null,
        history: oldData.history || {}
      };
      const migratedSchema = {
        selectedPathId: 'default-path',
        paths: [migratedPath],
        reflections: [],
        profile: {
          username: 'Focus User',
          email: '',
          isOnboarded: true,
          createdAt: new Date().toISOString()
        }
      };
      // Clean up old storage and write migrated
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedSchema));
      localStorage.removeItem('flowstate_kaizen_data');
      return migratedSchema;
    }
  } catch (e) {
    console.error("Error parsing localStorage schema", e);
  }
  return defaultSchema;
};

const normalizeImportedData = (candidate) => {
  const imported = candidate?.app === 'FlowState' && candidate?.data ? candidate.data : candidate;

  if (!imported || !Array.isArray(imported.paths) || imported.paths.length === 0) {
    throw new Error('Backup does not contain any FlowState paths.');
  }

  const selectedPathExists = imported.paths.some(path => path.id === imported.selectedPathId);
  return {
    selectedPathId: selectedPathExists ? imported.selectedPathId : imported.paths[0].id,
    paths: imported.paths.map(path => ({
      id: path.id || `path-${Date.now()}`,
      name: path.name || 'Restored Path',
      mode: path.mode || 'focus',
      defaultDuration: Number(path.defaultDuration) || 15,
      currentStreak: Number(path.currentStreak) || 0,
      lastActiveDate: path.lastActiveDate || null,
      history: path.history && typeof path.history === 'object' ? path.history : {}
    })),
    reflections: Array.isArray(imported.reflections) ? imported.reflections : [],
    profile: {
      username: imported.profile?.username || 'Focus User',
      email: imported.profile?.email || '',
      isOnboarded: imported.profile?.isOnboarded ?? true,
      createdAt: imported.profile?.createdAt || new Date().toISOString()
    }
  };
};

export function useKaizenTracker() {
  const [data, setData] = useState(getInitialData);
  const [isStorageReady, setIsStorageReady] = useState(false);

  // 1. Asynchronously load stats from native SQLite database on mount.
  // Proactively handles migrating legacy localStorage data to native SQLite if the database is empty.
  useEffect(() => {
    const loadSQLiteData = async () => {
      try {
        const sqliteSaved = await getSQLiteValue(STORAGE_KEY);
        if (sqliteSaved) {
          setData(JSON.parse(sqliteSaved));
        } else {
          // Fallback/Migration: If SQLite is empty, check for legacy localStorage data
          const localStorageSaved = localStorage.getItem(STORAGE_KEY);
          if (localStorageSaved) {
            // Write legacy data to native SQLite permanently
            await setSQLiteValue(STORAGE_KEY, localStorageSaved);
            setData(JSON.parse(localStorageSaved));
          }
        }
      } catch (e) {
        console.error("Error loading stats from SQLite database:", e);
      } finally {
        setIsStorageReady(true);
      }
    };
    loadSQLiteData();
  }, []);

  // 2. Initialize and check streaks for ALL paths on mount (state-only, updates will persist to SQLite)
  useEffect(() => {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    setData(prev => {
      let updated = false;
      const updatedPaths = prev.paths.map(path => {
        let newStreak = path.currentStreak;
        
        if (path.lastActiveDate !== today) {
          // If they missed yesterday, streak resets to 0
          if (path.lastActiveDate !== yesterday && path.lastActiveDate !== null) {
            newStreak = 0;
            updated = true;
          }
        }
        return { ...path, currentStreak: newStreak };
      });

      if (updated) {
        const newData = { ...prev, paths: updatedPaths };
        setSQLiteValue(STORAGE_KEY, JSON.stringify(newData));
        return newData;
      }
      return prev;
    });
  }, []);

  const selectPath = (pathId) => {
    setData(prev => {
      const newData = { ...prev, selectedPathId: pathId };
      setSQLiteValue(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const createPath = (name, mode, defaultDuration = 15) => {
    const newId = `path-${Date.now()}`;
    const newPath = {
      id: newId,
      name: name || 'Custom Path',
      mode: mode || 'focus',
      defaultDuration: Number(defaultDuration) || 15,
      currentStreak: 0,
      lastActiveDate: null,
      history: {}
    };

    setData(prev => {
      const newData = {
        ...prev,
        selectedPathId: newId,
        paths: [...prev.paths, newPath]
      };
      setSQLiteValue(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const updatePathDuration = (pathId, minutes) => {
    setData(prev => {
      const updatedPaths = prev.paths.map(path => {
        if (path.id === pathId) {
          return { ...path, defaultDuration: Number(minutes) };
        }
        return path;
      });
      const newData = { ...prev, paths: updatedPaths };
      setSQLiteValue(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const editPath = (pathId, name, mode, defaultDuration) => {
    setData(prev => {
      const updatedPaths = prev.paths.map(path => {
        if (path.id === pathId) {
          return {
            ...path,
            name: name || path.name,
            mode: mode || path.mode,
            defaultDuration: Number(defaultDuration) || path.defaultDuration
          };
        }
        return path;
      });
      const newData = { ...prev, paths: updatedPaths };
      setSQLiteValue(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const deletePath = (pathId) => {
    setData(prev => {
      if (prev.paths.length <= 1) return prev; // Keep at least one path
      
      const remainingPaths = prev.paths.filter(path => path.id !== pathId);
      const isSelectedDeleted = prev.selectedPathId === pathId;
      const newSelectedId = isSelectedDeleted ? remainingPaths[0].id : prev.selectedPathId;
      
      const newData = {
        ...prev,
        selectedPathId: newSelectedId,
        paths: remainingPaths
      };
      setSQLiteValue(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const addSessionTime = (minutesToAdd) => {
    if (minutesToAdd <= 0) return;

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    setData(prev => {
      const updatedPaths = prev.paths.map(path => {
        if (path.id !== prev.selectedPathId) return path;

        let newStreak = path.currentStreak;
        
        // If this is the first session today, update streak
        if (path.lastActiveDate !== today) {
          if (path.lastActiveDate === yesterday || path.lastActiveDate === null || newStreak === 0) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }

        const prevTodayEntry = path.history[today];
        const prevTodayTotal = typeof prevTodayEntry === 'object' ? (prevTodayEntry.total || 0) : (prevTodayEntry || 0);
        const prevTodayModes = typeof prevTodayEntry === 'object' ? (prevTodayEntry.modes || {}) : {};
        
        const todayTotal = prevTodayTotal + minutesToAdd;
        const todayModes = {
          ...prevTodayModes,
          [path.mode]: (prevTodayModes[path.mode] || 0) + minutesToAdd
        };

        return {
          ...path,
          currentStreak: newStreak,
          lastActiveDate: today,
          history: {
            ...path.history,
            [today]: {
              total: todayTotal,
              modes: todayModes
            }
          }
        };
      });

      const newData = { ...prev, paths: updatedPaths };
      setSQLiteValue(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const addSessionReflection = (reflection) => {
    const completedAt = reflection.completedAt || new Date().toISOString();
    const dateKey = getTodayDateString();
    const newReflection = {
      id: `reflection-${Date.now()}`,
      pathId: reflection.pathId || data.selectedPathId,
      pathName: reflection.pathName || activePath.name,
      mode: reflection.mode || activePath.mode,
      minutes: Number(reflection.minutes) || 0,
      rating: Number(reflection.rating),
      label: reflection.label || '',
      note: reflection.note || '',
      date: dateKey,
      completedAt
    };

    setData(prev => {
      const newData = {
        ...prev,
        reflections: [newReflection, ...(prev.reflections || [])].slice(0, 200)
      };
      setSQLiteValue(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const completeOnboarding = (username, email, initialPathName, initialPathMode, duration) => {
    const pathId = `path-${Date.now()}`;
    const newPath = {
      id: pathId,
      name: initialPathName.trim() || 'My Focus Path',
      mode: initialPathMode || 'focus',
      defaultDuration: Number(duration) || 15,
      currentStreak: 0,
      lastActiveDate: null,
      history: {}
    };

    setData(() => {
      const newData = {
        selectedPathId: pathId,
        paths: [newPath], // Replaces default path
        reflections: [],
        profile: {
          username: username.trim(),
          email: email.trim(),
          isOnboarded: true,
          createdAt: new Date().toISOString()
        }
      };
      setSQLiteValue(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  };

  const createBackup = () => ({
    app: 'FlowState',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data
  });

  const restoreBackup = async (backupPayload) => {
    const restoredData = normalizeImportedData(backupPayload);
    await setSQLiteValue(STORAGE_KEY, JSON.stringify(restoredData));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredData));
    setData(restoredData);
    return restoredData;
  };

  // Extract variables for the active path
  const activePath = data.paths.find(p => p.id === data.selectedPathId) || data.paths[0];
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const todayEntry = activePath.history[today];
  const todayMinutes = typeof todayEntry === 'object' ? (todayEntry.total || 0) : (todayEntry || 0);

  const yesterdayEntry = activePath.history[yesterday];
  const yesterdayMinutes = typeof yesterdayEntry === 'object' ? (yesterdayEntry.total || 0) : (yesterdayEntry || 0);

  // Scoped path metrics
  const totalMinutes = Object.values(activePath.history).reduce((sum, entry) => {
    const minutes = typeof entry === 'object' ? (entry.total || 0) : (entry || 0);
    return sum + minutes;
  }, 0);

  const modeAccumulator = {};
  Object.values(activePath.history).forEach(entry => {
    if (typeof entry === 'object' && entry.modes) {
      Object.entries(entry.modes).forEach(([modeName, mins]) => {
        modeAccumulator[modeName] = (modeAccumulator[modeName] || 0) + mins;
      });
    }
  });

  let favoriteMode = 'None';
  let maxMins = 0;
  Object.entries(modeAccumulator).forEach(([modeName, mins]) => {
    if (mins > maxMins) {
      maxMins = mins;
      favoriteMode = modeName;
    }
  });

  const sevenDayHistory = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const entry = activePath.history[dateKey];
    const mins = typeof entry === 'object' ? (entry.total || 0) : (entry || 0);

    sevenDayHistory.push({
      label: `${monthNames[d.getMonth()]} ${d.getDate()}`,
      minutes: mins
    });
  }

  const kaizenGoal = yesterdayMinutes > 0 ? Math.ceil(yesterdayMinutes * 1.05) : 5;
  const progress = Math.min((todayMinutes / kaizenGoal) * 100, 100);
  const isGoalMet = todayMinutes >= kaizenGoal;
  const reflections = data.reflections || [];
  const recentReflections = reflections.slice(0, 7);
  const averageFocusRating = recentReflections.length > 0
    ? recentReflections.reduce((sum, entry) => sum + (Number(entry.rating) || 0), 0) / recentReflections.length
    : 0;
  const weeklyTotalMinutes = sevenDayHistory.reduce((sum, day) => sum + day.minutes, 0);
  const activeDaysThisWeek = sevenDayHistory.filter(day => day.minutes > 0).length;
  const consistencyScore = Math.round((activeDaysThisWeek / 7) * 100);
  const bestDay = sevenDayHistory.reduce(
    (best, day) => day.minutes > best.minutes ? day : best,
    { label: 'None', minutes: 0 }
  );
  const dashboardInsight = (() => {
    if (weeklyTotalMinutes === 0) {
      return 'Start with one 5-minute session today to give your path its first signal.';
    }
    if (averageFocusRating > 0 && averageFocusRating < 3.5) {
      return 'Your focus quality is dipping. Try a shorter path or switch to Reset Break before the next deep session.';
    }
    if (activeDaysThisWeek >= 5) {
      return 'Your consistency is strong this week. Keep the ritual easy to repeat.';
    }
    if (bestDay.minutes > 0) {
      return `${bestDay.label} was your strongest day. Repeat that setup and duration.`;
    }
    return 'Keep sessions small and repeatable until the pattern is obvious.';
  })();

  return {
    paths: data.paths,
    activePath,
    selectedPathId: data.selectedPathId,
    profile: data.profile || { username: '', email: '', isOnboarded: false },
    isStorageReady,
    currentStreak: activePath.currentStreak,
    todayMinutes,
    yesterdayMinutes,
    totalMinutes,
    favoriteMode,
    reflections,
    recentReflections,
    averageFocusRating,
    weeklyTotalMinutes,
    activeDaysThisWeek,
    consistencyScore,
    bestDay,
    dashboardInsight,
    sevenDayHistory,
    kaizenGoal,
    progress,
    isGoalMet,
    selectPath,
    createPath,
    updatePathDuration,
    editPath,
    deletePath,
    addSessionTime,
    addSessionReflection,
    createBackup,
    restoreBackup,
    completeOnboarding
  };
}
