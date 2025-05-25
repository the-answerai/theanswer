import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        sourcemap: true
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: process.env.SERVER_URL || 'http://localhost:3001',
                changeOrigin: true
            }
        }
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.SERVER_URL': JSON.stringify(process.env.SERVER_URL || 'http://localhost:3001')
    }
})
