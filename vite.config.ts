import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Recharts is most of the bundle; a single ~190 kB gzipped chunk is fine for a local dashboard.
  build: { chunkSizeWarningLimit: 800 },
})
