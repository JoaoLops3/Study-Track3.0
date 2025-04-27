import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Limpa o ambiente após cada teste
afterEach(() => {
  cleanup();
}); 