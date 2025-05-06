import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do arquivo .env e .env.local
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@contexts': path.resolve(__dirname, 'src/contexts'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@lib': path.resolve(__dirname, 'src/lib'),
      },
    },
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@radix-ui/react-slot', '@radix-ui/react-tooltip'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    define: {
      'import.meta.env': JSON.stringify({
        VITE_GOOGLE_API_KEY: env.VITE_GOOGLE_API_KEY,
        VITE_GOOGLE_CLIENT_ID: env.VITE_GOOGLE_CLIENT_ID,
        VITE_GOOGLE_CLIENT_SECRET: env.VITE_GOOGLE_CLIENT_SECRET,
        VITE_GITHUB_CLIENT_ID: env.VITE_GITHUB_CLIENT_ID,
        VITE_GITHUB_CLIENT_SECRET: env.VITE_GITHUB_CLIENT_SECRET,
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
      }),
    },
    optimizeDeps: {
      include: ['src/pages/Login.tsx'],
    },
  };
});
