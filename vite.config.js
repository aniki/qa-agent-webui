import { defineConfig } from 'vite'

export default defineConfig({
  // Serveur de développement
  server: {
    port: 3000,
    open: true, // Ouvre automatiquement le navigateur
    host: true  // Accessible sur le réseau local
  },

  // Configuration du build pour la production
  build: {
    outDir: 'dist',
    // Inclure les assets dans le build
    rollupOptions: {
      input: 'index.html'
    }
  },

  // Pas de publicDir - les assets sont référencés directement
  publicDir: false
})
