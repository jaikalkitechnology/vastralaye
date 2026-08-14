import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// The app calls the API by absolute URL (src/config.tsx), so nothing depends on
// this proxy any more. It stays for anyone who wants same-origin requests in
// dev, and points at the same place the app does — it used to target a host from
// the old brand, which is what made proxied calls 502. Keep the default in step
// with src/config.tsx.
const API_ORIGIN = process.env.VITE_API_ORIGIN || 'http://127.0.0.1:8000';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: API_ORIGIN,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1')
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));