import React from 'react';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { usePomodoro } from '../contexts/PomodoroContext';

const PomodoroTimer: React.FC = () => {
  const {
    mode, setMode, timeLeft, isActive, completedSessions, minutesToday, resetTimer, toggleTimer, pomodoroSettings, showSessionComplete
  } = usePomodoro();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    switch (mode) {
      case 'work':
        return 'text-primary-600 dark:text-primary-400';
      case 'shortBreak':
        return 'text-secondary-500 dark:text-secondary-400';
      case 'longBreak':
        return 'text-accent-500 dark:text-accent-400';
    }
  };

  const getBackgroundColor = () => {
    switch (mode) {
      case 'work':
        return 'bg-primary-50 dark:bg-primary-900/10';
      case 'shortBreak':
        return 'bg-secondary-50 dark:bg-secondary-900/10';
      case 'longBreak':
        return 'bg-accent-50 dark:bg-accent-900/10';
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className={`rounded-full w-64 h-64 mx-auto flex items-center justify-center ${getBackgroundColor()}`}>
        <h2 className={`text-6xl font-bold ${getTimerColor()}`}>{formatTime(timeLeft)}</h2>
      </div>
      <div className="mt-6 flex justify-center space-x-3">
        <button onClick={() => setMode('work')} className={`px-4 py-2 rounded ${mode === 'work' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Trabalho</button>
        <button onClick={() => setMode('shortBreak')} className={`px-4 py-2 rounded ${mode === 'shortBreak' ? 'bg-secondary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Pausa Curta</button>
        <button onClick={() => setMode('longBreak')} className={`px-4 py-2 rounded ${mode === 'longBreak' ? 'bg-accent-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Pausa Longa</button>
      </div>
      <div className="mt-6 flex justify-center space-x-4">
        <button onClick={toggleTimer} className="px-6 py-2 rounded bg-primary-600 text-white flex items-center">
          {isActive ? <Pause size={20} className="mr-2" /> : <Play size={20} className="mr-2" />}
          {isActive ? 'Pausar' : 'Iniciar'}
        </button>
        <button onClick={resetTimer} className="px-6 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white flex items-center">
          <RotateCcw size={20} className="mr-2" />
          Reiniciar
        </button>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sessão {completedSessions} de {pomodoroSettings.sessionsUntilLongBreak}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {minutesToday} minutos estudados hoje
        </p>
      </div>
      {showSessionComplete && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white p-3 rounded-md shadow-lg animate-fade-in flex items-center">
          <CheckCircle size={20} className="mr-2" />
          <span>Sessão de trabalho concluída!</span>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer; 