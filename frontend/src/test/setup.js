import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Ensure automated unit/component tests use fixture data rather than live network
import.meta.env.VITE_USE_MOCK = 'true';
afterEach(() => {
  cleanup();
});
