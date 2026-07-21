import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Servi sous /app/ sur purinstinctgames.com (proxy Vercel depuis purinstinct-web)
// en plus de la racine sur purinstinct-app.vercel.app — voir vercel.json pour le
// rewrite qui fait correspondre /app/assets/* aux fichiers reels sous /assets/*.
export default defineConfig({
  base: "/app/",
  plugins: [react()],
})
