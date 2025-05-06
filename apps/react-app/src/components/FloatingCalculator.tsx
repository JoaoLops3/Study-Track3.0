import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calculator, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const FloatingCalculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const calculatorRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const handleOpenCalculator = () => {
    console.log('Abrindo calculadora...');
    setIsOpen(true);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (calculatorRef.current) {
      setIsDragging(true);
      const rect = calculatorRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !calculatorRef.current) return;

    const updatePosition = () => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - calculatorRef.current!.offsetWidth;
      const maxY = window.innerHeight - calculatorRef.current!.offsetHeight;
      
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

  const handleNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleEqual = () => {
    try {
      const result = eval(equation + display);
      setDisplay(result.toString());
      setEquation('');
    } catch (error) {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleScientific = (func: string) => {
    try {
      let result;
      switch (func) {
        case 'sin':
          result = Math.sin(parseFloat(display) * Math.PI / 180);
          break;
        case 'cos':
          result = Math.cos(parseFloat(display) * Math.PI / 180);
          break;
        case 'tan':
          result = Math.tan(parseFloat(display) * Math.PI / 180);
          break;
        case 'sqrt':
          result = Math.sqrt(parseFloat(display));
          break;
        case 'log':
          result = Math.log10(parseFloat(display));
          break;
        case 'ln':
          result = Math.log(parseFloat(display));
          break;
        default:
          return;
      }
      setDisplay(result.toString());
    } catch (error) {
      setDisplay('Error');
    }
  };

  return (
    <>
      <button
        onClick={handleOpenCalculator}
        className="fixed bottom-4 right-4 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 z-50 group"
      >
        <Calculator size={24} className="transform group-hover:scale-110 transition-transform" />
      </button>

      {isOpen && createPortal(
        <div
          ref={calculatorRef}
          className="fixed bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[9999] transition-transform duration-75 will-change-transform"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '320px',
            touchAction: 'none',
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-t-xl cursor-move flex justify-between items-center select-none"
            onMouseDown={handleMouseDown}
          >
            <span className="text-sm font-medium text-white">Calculadora Científica</span>
            <button
              onClick={() => {
                console.log('Fechando calculadora...');
                setIsOpen(false);
              }}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4">
            <div className="mb-2 text-right text-sm text-gray-500 dark:text-gray-400 h-4 font-mono">
              {equation}
            </div>
            <div className="mb-4 text-right text-3xl font-mono bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-lg backdrop-blur-sm">
              {display}
            </div>

            <div className="grid grid-cols-5 gap-2">
              <button onClick={() => handleScientific('sin')} className="btn-calc-modern">sin</button>
              <button onClick={() => handleScientific('cos')} className="btn-calc-modern">cos</button>
              <button onClick={() => handleScientific('tan')} className="btn-calc-modern">tan</button>
              <button onClick={() => handleScientific('sqrt')} className="btn-calc-modern">√</button>
              <button onClick={() => handleScientific('log')} className="btn-calc-modern">log</button>

              <button onClick={() => handleNumber('7')} className="btn-calc-modern">7</button>
              <button onClick={() => handleNumber('8')} className="btn-calc-modern">8</button>
              <button onClick={() => handleNumber('9')} className="btn-calc-modern">9</button>
              <button onClick={() => handleOperator('/')} className="btn-calc-modern">/</button>
              <button onClick={() => handleScientific('ln')} className="btn-calc-modern">ln</button>

              <button onClick={() => handleNumber('4')} className="btn-calc-modern">4</button>
              <button onClick={() => handleNumber('5')} className="btn-calc-modern">5</button>
              <button onClick={() => handleNumber('6')} className="btn-calc-modern">6</button>
              <button onClick={() => handleOperator('*')} className="btn-calc-modern">×</button>
              <button onClick={() => handleNumber('(')} className="btn-calc-modern">(</button>

              <button onClick={() => handleNumber('1')} className="btn-calc-modern">1</button>
              <button onClick={() => handleNumber('2')} className="btn-calc-modern">2</button>
              <button onClick={() => handleNumber('3')} className="btn-calc-modern">3</button>
              <button onClick={() => handleOperator('-')} className="btn-calc-modern">-</button>
              <button onClick={() => handleNumber(')')} className="btn-calc-modern">)</button>

              <button onClick={() => handleNumber('0')} className="btn-calc-modern">0</button>
              <button onClick={() => handleNumber('.')} className="btn-calc-modern">.</button>
              <button onClick={handleEqual} className="btn-calc-modern bg-gradient-to-r from-indigo-500 to-purple-600 text-white">=</button>
              <button onClick={() => handleOperator('+')} className="btn-calc-modern">+</button>
              <button onClick={handleClear} className="btn-calc-modern bg-gradient-to-r from-red-500 to-pink-600 text-white">C</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default FloatingCalculator; 