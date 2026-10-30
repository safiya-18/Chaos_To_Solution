import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15000,
    env: {
      GROQ_API_KEY: 'mock-groq-key-for-test-isolation',
      EVENT_ADMIN_TOKEN: 'mock-test-admin-secret-token'
    }
  }
});
