import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { User } from '@supabase/supabase-js';

// Mock do Supabase
vi.mock('../lib/supabase', () => {
  const mockGetUser = vi.fn();
  const mockSignIn = vi.fn();
  const mockSignUp = vi.fn();
  const mockSignOut = vi.fn();
  const mockOnAuthStateChange = vi.fn();

  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
        signInWithPassword: mockSignIn,
        signUp: mockSignUp,
        signOut: mockSignOut,
        onAuthStateChange: (callback: any) => {
          mockOnAuthStateChange(callback);
          return {
            data: { subscription: { unsubscribe: vi.fn() } }
          };
        }
      }
    },
    mockGetUser,
    mockSignIn,
    mockSignUp,
    mockSignOut,
    mockOnAuthStateChange
  };
});

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('useAuth', () => {
  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const { mockGetUser } = require('../lib/supabase');
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it('deve iniciar com usuário nulo e loading true', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('deve carregar o usuário atual', async () => {
    const { mockGetUser } = require('../lib/supabase');
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    
    const { result } = renderHook(() => useAuth());
    
    // Aguarda o loading terminar
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('deve lidar com erro ao carregar usuário', async () => {
    const { mockGetUser } = require('../lib/supabase');
    const error = new Error('Erro ao carregar usuário');
    mockGetUser.mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('deve fazer login com sucesso', async () => {
    const { mockSignIn } = require('../lib/supabase');
    mockSignIn.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });
    
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });

  it('deve lidar com erro ao fazer login', async () => {
    const { mockSignIn } = require('../lib/supabase');
    const error = new Error('Erro ao fazer login');
    mockSignIn.mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => useAuth());
    
    await expect(
      result.current.signIn('test@example.com', 'password')
    ).rejects.toThrow('Erro ao fazer login');
  });

  it('deve fazer logout com sucesso', async () => {
    const { mockSignOut } = require('../lib/supabase');
    mockSignOut.mockResolvedValueOnce({ error: null });
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signOut();
    });
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('deve lidar com erro ao fazer logout', async () => {
    const { mockSignOut } = require('../lib/supabase');
    const error = new Error('Erro ao fazer logout');
    mockSignOut.mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => useAuth());
    
    await expect(
      result.current.signOut()
    ).rejects.toThrow('Erro ao fazer logout');
  });

  it('deve atualizar o usuário quando houver mudança na autenticação', async () => {
    const { mockOnAuthStateChange } = require('../lib/supabase');
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      // Simula uma mudança na autenticação
      const callback = mockOnAuthStateChange.mock.calls[0][0];
      callback('SIGNED_IN', { user: mockUser });
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });
}); 