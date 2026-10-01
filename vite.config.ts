import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@base-ui/react': path.resolve(root, 'node_modules/@base-ui/react'),
      '@dnd-kit/core': path.resolve(root, 'node_modules/@dnd-kit/core'),
    },
  },
  server: {
    fs: {
      allow: [root, '/Users/radhiladd/design/systems-workspace/packages/dcp-hds-staging/dist-package'],
    },
  },
})
