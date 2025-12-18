import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Permanent Fix: Load env file explicitly to ensure it works on Windows/Localhost
  const env = loadEnv(mode, process.cwd(), '')

  // Fallback to hardcoded values if .env fails to load (Common on some Windows setups)
  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://supa.synergybrandarchitect.in';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTcxOTYwMCwiZXhwIjo0OTIxMzkzMjAwLCJyb2xlIjoiYW5vbiJ9.0YMnAgbghZVyaB7XfcGsuD96167msLOI8o4UK9sdtvQ';

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo-light.png'],
        workbox: {
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB limit
        },
        manifest: {
          name: 'RealSalePro - Sales Management',
          short_name: 'RealSalePro',
          description: 'RealSalePro - Sales Management App for modern teams.',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  }
});
