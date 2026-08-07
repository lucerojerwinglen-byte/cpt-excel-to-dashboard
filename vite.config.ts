import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Everything must inline into one HTML file with no external requests at
// runtime (ADR 0005: presented live from a laptop with no guaranteed
// meeting-room internet, opened via file:// with no local server).
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 10_000,
  },
})
