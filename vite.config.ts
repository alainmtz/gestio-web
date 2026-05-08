import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/, priority: 30 },
            { name: 'vendor-supabase', test: /[\\/]node_modules[\\/]@supabase[\\/]/, priority: 25 },
            { name: 'vendor-tanstack', test: /[\\/]node_modules[\\/]@tanstack[\\/]/, priority: 25 },
            { name: 'vendor-radix', test: /[\\/]node_modules[\\/]@radix-ui[\\/]/, priority: 20 },
            { name: 'vendor-recharts', test: /[\\/]node_modules[\\/]recharts[\\/]/, priority: 20 },
            { name: 'vendor-lucide', test: /[\\/]node_modules[\\/]lucide-react[\\/]/, priority: 20 },
            { name: 'vendor-forms', test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/, priority: 15 },
            { name: 'vendor-utils', test: /[\\/]node_modules[\\/](date-fns|class-variance-authority|clsx|tailwind-merge)[\\/]/, priority: 15 },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
