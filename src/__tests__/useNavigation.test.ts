import { renderHook } from '@testing-library/react';
import { useNavigation } from '../hooks/useNavigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock do useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useNavigation', () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    mockNavigate.mockClear();
  });

  it('deve navegar para a página de login', () => {
    const { result } = renderHook(() => useNavigation());
    
    result.current.goToLogin();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('deve navegar para o dashboard', () => {
    const { result } = renderHook(() => useNavigation());
    
    result.current.goToDashboard();
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('não deve navegar se as funções não forem chamadas', () => {
    renderHook(() => useNavigation());
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });
}); 