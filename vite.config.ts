import path from "path"
import { execSync } from "node:child_process"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

const host = process.env.TAURI_DEV_HOST

function getGitRev() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim()
  } catch {
    return "unknown"
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __GIT_REV__: JSON.stringify(getGitRev()),
  },
  plugins: [react(), tailwindcss(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 5174,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
})
