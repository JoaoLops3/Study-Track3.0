import { useState, useEffect } from 'react';
import { FONT_SIZES } from '../../constants';

/**
 * Componente para seleção do tamanho da fonte
 * 
 * @component
 * @example
 * return (
 *   <FontSizeSelector />
 * )
 */
export const FontSizeSelector = () => {
  const [currentSize, setCurrentSize] = useState(FONT_SIZES.MEDIUM);

  useEffect(() => {
    // Aplica o tamanho da fonte ao carregar o componente
    document.documentElement.classList.add(currentSize);
    return () => {
      document.documentElement.classList.remove(currentSize);
    };
  }, [currentSize]);

  const handleSizeChange = (size: string) => {
    // Remove todas as classes de tamanho
    Object.values(FONT_SIZES).forEach(sizeClass => {
      document.documentElement.classList.remove(sizeClass);
    });
    // Adiciona a nova classe
    document.documentElement.classList.add(size);
    setCurrentSize(size);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Tamanho da Fonte:</span>
      <button
        onClick={() => handleSizeChange(FONT_SIZES.SMALL)}
        className={`px-2 py-1 rounded ${
          currentSize === FONT_SIZES.SMALL ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        Pequeno
      </button>
      <button
        onClick={() => handleSizeChange(FONT_SIZES.MEDIUM)}
        className={`px-2 py-1 rounded ${
          currentSize === FONT_SIZES.MEDIUM ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        Médio
      </button>
      <button
        onClick={() => handleSizeChange(FONT_SIZES.LARGE)}
        className={`px-2 py-1 rounded ${
          currentSize === FONT_SIZES.LARGE ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        Grande
      </button>
    </div>
  );
}; 