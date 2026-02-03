import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Serveur de développement
  server: {
    port: 3000,
    open: true, // Ouvre automatiquement le navigateur
    host: true  // Accessible sur le réseau local
  },

  // Configuration du build pour la production (Web App)
  build: {
    outDir: 'dist/web',
    // Inclure les assets dans le build
    rollupOptions: {
      input: 'index.html'
    }
  },

  // Pas de publicDir - les assets sont référencés directement
  publicDir: false,

  // Aliases pour les imports
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core')
    }
  }
})
