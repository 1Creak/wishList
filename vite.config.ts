import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Site is served from https://1creak.github.io/wishList/
export default defineConfig({
  base: '/wishList/',
  plugins: [react(), tailwindcss()],
})
