import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'

// Custom plugin to copy extension files
function copyExtensionFiles() {
    return {
        name: 'copy-extension-files',
        closeBundle() {
            const distDir = 'dist/extension'

            // Ensure dist directory exists
            if (!existsSync(distDir)) {
                mkdirSync(distDir, { recursive: true })
            }

            // Copy manifest.json
            copyFileSync(
                'src/extension/manifest.json',
                `${distDir}/manifest.json`
            )

            // Copy sidepanel files
            mkdirSync(`${distDir}/sidepanel`, { recursive: true })
            copyFileSync(
                'src/extension/sidepanel/index.html',
                `${distDir}/sidepanel/index.html`
            )
            copyFileSync(
                'src/extension/sidepanel/sidepanel.css',
                `${distDir}/sidepanel/sidepanel.css`
            )

            // Copy background files
            mkdirSync(`${distDir}/background`, { recursive: true })

            // Copy content scripts
            mkdirSync(`${distDir}/content`, { recursive: true })
            copyFileSync(
                'src/extension/content/content.js',
                `${distDir}/content/content.js`
            )

            // Copy assets (icons)
            const assetsDir = 'src/extension/assets'
            if (existsSync(assetsDir)) {
                copyDirRecursive(assetsDir, `${distDir}/assets`)
            }

            console.log('✅ Extension files copied to dist/extension')
        }
    }
}

// Helper to recursively copy directories
function copyDirRecursive(src, dest) {
    if (!existsSync(dest)) {
        mkdirSync(dest, { recursive: true })
    }

    const entries = readdirSync(src)
    for (const entry of entries) {
        const srcPath = `${src}/${entry}`
        const destPath = `${dest}/${entry}`

        if (statSync(srcPath).isDirectory()) {
            copyDirRecursive(srcPath, destPath)
        } else {
            copyFileSync(srcPath, destPath)
        }
    }
}

export default defineConfig({
    build: {
        outDir: 'dist/extension',
        emptyDirBeforeWrite: true,
        rollupOptions: {
            input: {
                sidepanel: resolve(__dirname, 'src/extension/sidepanel/sidepanel.js'),
                'service-worker': resolve(__dirname, 'src/extension/background/service-worker.js')
            },
            output: {
                entryFileNames: (chunkInfo) => {
                    if (chunkInfo.name === 'sidepanel') {
                        return 'sidepanel/sidepanel.js'
                    }
                    if (chunkInfo.name === 'service-worker') {
                        return 'background/service-worker.js'
                    }
                    return '[name].js'
                },
                chunkFileNames: 'shared/[name]-[hash].js',
                assetFileNames: 'assets/[name][extname]'
            }
        },
        // Bundle for Chrome extension (can't use CDN due to CSP restrictions)
        target: 'chrome90',
        minify: 'esbuild' // Use esbuild (built-in) instead of terser
    },
    plugins: [copyExtensionFiles()],
    resolve: {
        alias: {
            '@core': resolve(__dirname, 'src/core')
        }
    }
})
