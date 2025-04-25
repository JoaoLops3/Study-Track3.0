import { useState, useEffect } from 'react';

type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZES = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

export function useFontSize() {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    // Tenta recuperar o tamanho salvo no localStorage
    const saved = localStorage.getItem('fontSize');
    return (saved as FontSize) || 'medium';
  });

  useEffect(() => {
    // Aplica o tamanho da fonte diretamente no estilo do documento
    document.documentElement.style.fontSize = FONT_SIZES[fontSize];
    
    // Salva no localStorage
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  return {
    fontSize,
    setFontSize,
  };
} 