import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Limpa o ambiente após cada teste
afterEach(() => {
  cleanup();
});

// Teste básico para garantir que o setup está funcionando
describe('Setup', () => {
  it('should have testing library configured', () => {
    expect(true).toBe(true);
  });
}); 