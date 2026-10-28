import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 5000,
    env: {
      GROQ_API_KEY: 'mock-groq-key-for-test-isolation'
    }
  }
});
