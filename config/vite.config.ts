import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'


import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Permanent Fix: Load env file explicitly to ensure it works on Windows/Localhost
  const env = loadEnv(mode, process.cwd(), '')

  const apiUrl = mode === 'production' ? '/api' : (env.VITE_API_URL || 'http://localhost:5001/api');

  return {
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    resolve: {
      alias: [
        { find: /.*\/convex\/_generated\/api.*/, replacement: path.resolve(__dirname, '../src/lib/api-endpoints.ts') },
        { find: /.*\/convex\/_generated\/dataModel.*/, replacement: path.resolve(__dirname, '../src/lib/api-endpoints.ts') },
        { find: 'convex/react', replacement: path.resolve(__dirname, '../src/lib/convex-bridge.ts') },
      ],
    },
    plugins: [
      react(),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  }
});
