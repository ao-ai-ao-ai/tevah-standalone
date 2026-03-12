import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Read HARVEST credentials from env (sourced from ~/.b2b-env)
const harvestUser = process.env.HARVEST_USER || 'harvest'
const harvestPass = process.env.HARVEST_PASS || ''
const harvestAuth = Buffer.from(`${harvestUser}:${harvestPass}`).toString('base64')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: ['tevah.158-101-101-234.sslip.io'],
    proxy: {
      '/api/brain': {
        target: 'http://localhost:8900',
        rewrite: (path) => path.replace(/^\/api\/brain/, ''),
      },
      '/api/audit': {
        target: 'http://localhost:8901',
        rewrite: (path) => path.replace(/^\/api\/audit/, ''),
      },
      '/api/recon': {
        target: 'http://localhost:8088',
        headers: {
          'Authorization': `Basic ${harvestAuth}`,
        },
      },
    },
  },
})
