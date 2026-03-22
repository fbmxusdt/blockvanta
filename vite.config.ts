import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ── Base path ────────────────────────────────────────────────────────────────
// GitHub Pages serves apps at https://<user>.github.io/<repo>/, not at root.
// Set VITE_BASE_URL=/<repo>/ in .env.production (or inline at build time).
// Defaults to '/' for local dev so nothing breaks during development.
//
// Example .env.production:
//   VITE_BASE_URL=/blackvanta-app/
//
// Or pass inline:
//   VITE_BASE_URL=/blackvanta-app/ npm run build
const base = process.env.VITE_BASE_URL ?? '/'

export default defineConfig({
  plugins: [react()],
  base,
})
