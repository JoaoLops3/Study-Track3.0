import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

interface PomodoroContextType {
  mode: 'work' | 'shortBreak' | 'longBreak';
  setMode: (mode: 'work' | 'shortBreak' | 'longBreak') => void;
  timeLeft: number;
  setTimeLeft: (time: number) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  completedSessions: number;
  setCompletedSessions: (n: number) => void;
  minutesToday: number;
  resetTimer: () => void;
  toggleTimer: () => void;
  pomodoroSettings: typeof defaultSettings;
  showSessionComplete: boolean;
}

const defaultSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

const STORAGE_KEY = 'pomodoro_minutes_today';
const DATE_KEY = 'pomodoro_date';
const STATE_KEY = 'pomodoro_state';

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(defaultSettings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [minutesToday, setMinutesToday] = useState(0);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar estado do localStorage
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const savedDate = localStorage.getItem(DATE_KEY);
    if (savedDate !== today) {
      localStorage.setItem(DATE_KEY, today);
      localStorage.setItem(STORAGE_KEY, '0');
      setMinutesToday(0);
      setCompletedSessions(0);
    } else {
      const savedMinutes = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      setMinutesToday(savedMinutes);
      // Estado extra
      const savedState = localStorage.getItem(STATE_KEY);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setMode(parsed.mode || 'work');
          setTimeLeft(parsed.timeLeft || defaultSettings.workDuration * 60);
          setIsActive(parsed.isActive || false);
          setCompletedSessions(parsed.completedSessions || 0);
        } catch {}
      }
    }
    // Listener para sincronizar entre abas
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === DATE_KEY || e.key === STATE_KEY) {
        const today = new Date().toISOString().slice(0, 10);
        const savedDate = localStorage.getItem(DATE_KEY);
        if (savedDate !== today) {
          setMinutesToday(0);
          setCompletedSessions(0);
        } else {
          const savedMinutes = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
          setMinutesToday(savedMinutes);
          const savedState = localStorage.getItem(STATE_KEY);
          if (savedState) {
            try {
              const parsed = JSON.parse(savedState);
              setMode(parsed.mode || 'work');
              setTimeLeft(parsed.timeLeft || defaultSettings.workDuration * 60);
              setIsActive(parsed.isActive || false);
              setCompletedSessions(parsed.completedSessions || 0);
            } catch {}
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Persistir estado no localStorage
  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ mode, timeLeft, isActive, completedSessions }));
  }, [mode, timeLeft, isActive, completedSessions]);

  // Timer principal
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (mode === 'work') {
        const newCompletedSessions = completedSessions + 1;
        setCompletedSessions(newCompletedSessions);
        setShowSessionComplete(true);
        setTimeout(() => setShowSessionComplete(false), 3000);
        // Atualizar minutos estudados hoje
        const today = new Date().toISOString().slice(0, 10);
        let savedMinutes = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
        savedMinutes += defaultSettings.workDuration;
        localStorage.setItem(STORAGE_KEY, savedMinutes.toString());
        localStorage.setItem(DATE_KEY, today);
        setMinutesToday(savedMinutes);
        if (newCompletedSessions % defaultSettings.sessionsUntilLongBreak === 0) {
          setMode('longBreak');
        } else {
          setMode('shortBreak');
        }
      } else {
        setMode('work');
      }
      setIsActive(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, completedSessions]);

  const toggleTimer = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    let duration = 0;
    switch (mode) {
      case 'work':
        duration = defaultSettings.workDuration;
        break;
      case 'shortBreak':
        duration = defaultSettings.shortBreakDuration;
        break;
      case 'longBreak':
        duration = defaultSettings.longBreakDuration;
        break;
    }
    setTimeLeft(duration * 60);
    setIsActive(false);
  }, [mode]);

  return (
    <PomodoroContext.Provider value={{
      mode, setMode, timeLeft, setTimeLeft, isActive, setIsActive, completedSessions, setCompletedSessions, minutesToday, resetTimer, toggleTimer, pomodoroSettings: defaultSettings, showSessionComplete
    }}>
      {children}
    </PomodoroContext.Provider>
  );
};

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro deve ser usado dentro de PomodoroProvider');
  return ctx;
} 