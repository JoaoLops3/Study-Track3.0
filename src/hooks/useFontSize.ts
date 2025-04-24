import { useState, useEffect } from 'react';

type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZE_CLASSES = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};

export function useFontSize() {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    // Tenta recuperar o tamanho salvo no localStorage
    const saved = localStorage.getItem('fontSize');
    return (saved as FontSize) || 'medium';
  });

  useEffect(() => {
    // Aplica o tamanho da fonte em todo o documento
    const html = document.documentElement;
    const body = document.body;
    
    // Remove todas as classes de tamanho
    Object.values(FONT_SIZE_CLASSES).forEach(className => {
      html.classList.remove(className);
      body.classList.remove(className);
    });

    // Adiciona a classe do tamanho atual
    const currentClass = FONT_SIZE_CLASSES[fontSize];
    html.classList.add(currentClass);
    body.classList.add(currentClass);
    
    // Aplica a classe em todos os elementos que precisam manter o tamanho
    document.querySelectorAll('.keep-font-size').forEach(element => {
      element.classList.remove(...Object.values(FONT_SIZE_CLASSES));
      element.classList.add(currentClass);
    });
    
    // Salva no localStorage
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  return {
    fontSize,
    setFontSize,
  };
} 