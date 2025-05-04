import { renderHook, act } from '@testing-library/react';
import { useFontSize } from '../hooks/useFontSize';

describe('useFontSize', () => {
  beforeEach(() => {
    // Limpa o localStorage antes de cada teste
    localStorage.clear();
    // Reseta o estilo do documento
    document.documentElement.style.fontSize = '';
    document.documentElement.removeAttribute('data-font-size');
  });

  it('deve iniciar com o tamanho médio por padrão', () => {
    const { result } = renderHook(() => useFontSize());
    expect(result.current.fontSize).toBe('medium');
    expect(document.documentElement.style.fontSize).toBe('16px');
  });

  it('deve recuperar o tamanho salvo no localStorage', () => {
    localStorage.setItem('fontSize', 'large');
    const { result } = renderHook(() => useFontSize());
    expect(result.current.fontSize).toBe('large');
    expect(document.documentElement.style.fontSize).toBe('18px');
  });

  it('deve atualizar o tamanho da fonte e salvar no localStorage', () => {
    const { result } = renderHook(() => useFontSize());

    act(() => {
      result.current.setFontSize('small');
    });

    expect(result.current.fontSize).toBe('small');
    expect(document.documentElement.style.fontSize).toBe('14px');
    expect(localStorage.getItem('fontSize')).toBe('small');
    expect(document.documentElement.getAttribute('data-font-size')).toBe('small');
  });

  it('deve manter o tamanho da fonte entre renderizações', () => {
    const { result, rerender } = renderHook(() => useFontSize());

    act(() => {
      result.current.setFontSize('large');
    });

    rerender();

    expect(result.current.fontSize).toBe('large');
    expect(document.documentElement.style.fontSize).toBe('18px');
  });
}); 