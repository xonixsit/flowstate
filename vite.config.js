import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  build: {
    cssMinify: 'esbuild' // use esbuild instead of lightningcss for Tailwind @ directives
  }
})
