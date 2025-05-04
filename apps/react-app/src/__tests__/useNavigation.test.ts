import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useNavigation } from '../hooks/useNavigation';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(MemoryRouter, null, children);
};

describe('useNavigation', () => {
  beforeEach(() => {
    // Limpa o localStorage antes de cada teste
    localStorage.clear();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it('should update current page', async () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });
    
    await act(async () => {
      result.current.setCurrentPage(2);
    });
    
    expect(result.current.currentPage).toBe(2);
  });

  it('should update total pages', async () => {
    const { result } = renderHook(() => useNavigation(), { wrapper });
    
    await act(async () => {
      result.current.setTotalPages(5);
    });
    
    expect(result.current.totalPages).toBe(5);
  });
}); 