/// <reference types="vitest/config" />

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: env.VITE_BASE_PATH || '/',
    cacheDir: '.cache/vite',
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      env: {
        VITE_ADMIN_USERNAME: 'Admin',
        VITE_ADMIN_PASSWORD_HASH:
          '006a516c76cd0a40d62017cfe52907d8210c14f031fb1e7fd7580ea9e11243a9',
        VITE_ADMIN_SESSION_MINUTES: '30',
        VITE_ADMIN_AUTH_DISABLED: '',
      },
    },
  };
});
