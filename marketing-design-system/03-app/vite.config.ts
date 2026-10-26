import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // marketing-design-system/ is a reference copy of this project; keep it out of dev-server scanning.
  optimizeDeps: { entries: ['index.html'] },
  server: { watch: { ignored: ['**/marketing-design-system/**'] } },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/unit/setup.ts'],
  },
})
