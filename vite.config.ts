import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { seoPlugin } from './plugins/seo.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Loaded manually because the SEO plugin needs the Supabase credentials
  // inside buildStart, before Vite exposes import.meta.env to the app.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), seoPlugin(env)],
  }
})
