import React, { useState, useEffect, useRef, useCallback } from "react";
import { Calculator, X } from "lucide-react";
import { createPortal } from "react-dom";

const FloatingCalculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const calculatorRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const handleOpenCalculator = () => {
    console.log("Abrindo calculadora...");
    setIsOpen(true);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (calculatorRef.current) {
      setIsDragging(true);
      const rect = calculatorRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !calculatorRef.current) return;

      const updatePosition = () => {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        const maxX = window.innerWidth - calculatorRef.current!.offsetWidth;
        const maxY = window.innerHeight - calculatorRef.current!.offsetHeight;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });

        animationFrameRef.current = requestAnimationFrame(updatePosition);
      };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleNumber = (num: string) => {
    if (display === "0") {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + " " + op + " ");
    setDisplay("0");
  };

  const handleEqual = () => {
    try {
      const result = eval(equation + display);
      setDisplay(result.toString());
      setEquation("");
    } catch (error) {
      setDisplay("Error");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
  };

  const handleScientific = (func: string) => {
    try {
      let result;
      switch (func) {
        case "sin":
          result = Math.sin((parseFloat(display) * Math.PI) / 180);
          break;
        case "cos":
          result = Math.cos((parseFloat(display) * Math.PI) / 180);
          break;
        case "tan":
          result = Math.tan((parseFloat(display) * Math.PI) / 180);
          break;
        case "sqrt":
          result = Math.sqrt(parseFloat(display));
          break;
        case "log":
          result = Math.log10(parseFloat(display));
          break;
        case "ln":
          result = Math.log(parseFloat(display));
          break;
        default:
          return;
      }
      setDisplay(result.toString());
    } catch (error) {
      setDisplay("Error");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 p-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 z-50 group md:bottom-28 md:right-6"
      >
        <Calculator className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
      </button>

      {isOpen && (
        <div
          ref={calculatorRef}
          className="fixed z-50 cursor-move"
          style={{ left: position.x, top: position.y }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4">
            <div
              className="flex justify-between items-center mb-4 cursor-move select-none"
              onMouseDown={handleMouseDown}
              style={{ cursor: "move" }}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Calculadora
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
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
                <button
                  onClick={() => handleScientific("sin")}
                  className="btn-calc-modern"
                >
                  sin
                </button>
                <button
                  onClick={() => handleScientific("cos")}
                  className="btn-calc-modern"
                >
                  cos
                </button>
                <button
                  onClick={() => handleScientific("tan")}
                  className="btn-calc-modern"
                >
                  tan
                </button>
                <button
                  onClick={() => handleScientific("sqrt")}
                  className="btn-calc-modern"
                >
                  √
                </button>
                <button
                  onClick={() => handleScientific("log")}
                  className="btn-calc-modern"
                >
                  log
                </button>

                <button
                  onClick={() => handleNumber("7")}
                  className="btn-calc-modern"
                >
                  7
                </button>
                <button
                  onClick={() => handleNumber("8")}
                  className="btn-calc-modern"
                >
                  8
                </button>
                <button
                  onClick={() => handleNumber("9")}
                  className="btn-calc-modern"
                >
                  9
                </button>
                <button
                  onClick={() => handleOperator("/")}
                  className="btn-calc-modern"
                >
                  /
                </button>
                <button
                  onClick={() => handleScientific("ln")}
                  className="btn-calc-modern"
                >
                  ln
                </button>

                <button
                  onClick={() => handleNumber("4")}
                  className="btn-calc-modern"
                >
                  4
                </button>
                <button
                  onClick={() => handleNumber("5")}
                  className="btn-calc-modern"
                >
                  5
                </button>
                <button
                  onClick={() => handleNumber("6")}
                  className="btn-calc-modern"
                >
                  6
                </button>
                <button
                  onClick={() => handleOperator("*")}
                  className="btn-calc-modern"
                >
                  ×
                </button>
                <button
                  onClick={() => handleNumber("(")}
                  className="btn-calc-modern"
                >
                  (
                </button>

                <button
                  onClick={() => handleNumber("1")}
                  className="btn-calc-modern"
                >
                  1
                </button>
                <button
                  onClick={() => handleNumber("2")}
                  className="btn-calc-modern"
                >
                  2
                </button>
                <button
                  onClick={() => handleNumber("3")}
                  className="btn-calc-modern"
                >
                  3
                </button>
                <button
                  onClick={() => handleOperator("-")}
                  className="btn-calc-modern"
                >
                  -
                </button>
                <button
                  onClick={() => handleNumber(")")}
                  className="btn-calc-modern"
                >
                  )
                </button>

                <button
                  onClick={() => handleNumber("0")}
                  className="btn-calc-modern"
                >
                  0
                </button>
                <button
                  onClick={() => handleNumber(".")}
                  className="btn-calc-modern"
                >
                  .
                </button>
                <button
                  onClick={handleEqual}
                  className="btn-calc-modern bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                >
                  =
                </button>
                <button
                  onClick={() => handleOperator("+")}
                  className="btn-calc-modern"
                >
                  +
                </button>
                <button
                  onClick={handleClear}
                  className="btn-calc-modern bg-gradient-to-r from-red-500 to-pink-600 text-white"
                >
                  C
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCalculator;
