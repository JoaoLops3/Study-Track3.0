import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Timer, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import PomodoroTimer from './PomodoroTimer';

const FloatingPomodoro: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 100 }); // Acima da calculadora
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const pomodoroRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Botão de abrir Pomodoro
  const handleOpenPomodoro = () => {
    setIsOpen(true);
  };

  // Arrasto
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (pomodoroRef.current) {
      setIsDragging(true);
      const rect = pomodoroRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !pomodoroRef.current) return;
    const updatePosition = () => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - pomodoroRef.current!.offsetWidth;
      const maxY = window.innerHeight - pomodoroRef.current!.offsetHeight;
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    };
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(updatePosition);
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Botão flutuante acima da calculadora
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 p-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 z-50 group md:bottom-6 md:left-6"
      >
        <Timer className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
      </button>
      {isOpen && (
        <div
          ref={pomodoroRef}
          className="fixed z-50 cursor-move"
          style={{ left: position.x, top: position.y }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4">
            <div
              className="flex justify-between items-center mb-4 cursor-move select-none"
              onMouseDown={handleMouseDown}
              style={{ cursor: 'move' }}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pomodoro</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <PomodoroTimer />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingPomodoro; 