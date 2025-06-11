// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/demoHTX-tailwind/', // <- tên repo GitHub của bạn
  plugins: [react()],
})