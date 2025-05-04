import { render, screen, fireEvent } from '@testing-library/react';
import { FontSizeSelector } from '../components/accessibility/FontSizeSelector';
import { FONT_SIZES } from '../constants';

describe('FontSizeSelector', () => {
  beforeEach(() => {
    // Limpa as classes do documentElement antes de cada teste
    Object.values(FONT_SIZES).forEach(sizeClass => {
      document.documentElement.classList.remove(sizeClass);
    });
  });

  it('renderiza corretamente', () => {
    render(<FontSizeSelector />);
    expect(screen.getByText('Tamanho da Fonte:')).toBeInTheDocument();
    expect(screen.getByText('Pequeno')).toBeInTheDocument();
    expect(screen.getByText('Médio')).toBeInTheDocument();
    expect(screen.getByText('Grande')).toBeInTheDocument();
  });

  it('muda o tamanho da fonte quando um botão é clicado', () => {
    render(<FontSizeSelector />);
    const smallButton = screen.getByText('Pequeno');
    
    fireEvent.click(smallButton);
    expect(document.documentElement.classList.contains(FONT_SIZES.SMALL)).toBe(true);
    expect(document.documentElement.classList.contains(FONT_SIZES.MEDIUM)).toBe(false);
    expect(document.documentElement.classList.contains(FONT_SIZES.LARGE)).toBe(false);
  });

  it('mantém apenas um tamanho de fonte ativo por vez', () => {
    render(<FontSizeSelector />);
    const mediumButton = screen.getByText('Médio');
    const largeButton = screen.getByText('Grande');
    
    fireEvent.click(mediumButton);
    expect(document.documentElement.classList.contains(FONT_SIZES.MEDIUM)).toBe(true);
    
    fireEvent.click(largeButton);
    expect(document.documentElement.classList.contains(FONT_SIZES.MEDIUM)).toBe(false);
    expect(document.documentElement.classList.contains(FONT_SIZES.LARGE)).toBe(true);
  });
}); 