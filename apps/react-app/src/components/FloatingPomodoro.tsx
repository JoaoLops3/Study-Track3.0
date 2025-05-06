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
        onClick={handleOpenPomodoro}
        className="fixed bottom-24 right-4 p-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 z-[51] group"
      >
        <Timer size={24} className="transform group-hover:scale-110 transition-transform" />
      </button>
      {isOpen && createPortal(
        <div
          ref={pomodoroRef}
          className="fixed bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[9999] transition-transform duration-75 will-change-transform"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '370px',
            touchAction: 'none',
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-t-xl cursor-move flex justify-between items-center select-none"
            onMouseDown={handleMouseDown}
          >
            <span className="text-sm font-medium text-white">Pomodoro</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-4">
            <PomodoroTimer />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default FloatingPomodoro; 