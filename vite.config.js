import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        host: true
    },
    define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://xakyjvlxypivrmuehsxl.supabase.co'),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhha3lqdmx4eXBpdnJtdWVoc3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODE2NjQsImV4cCI6MjA4NzI1NzY2NH0.EVSIXlO5yd5SHPwlcUDeR3m7pNXKV5-hu1UfJjPE-EE'),
        'import.meta.env.VITE_TELEGRAM_BOT_USERNAME': JSON.stringify('rail_match_bot')
    },
    build: {
        target: 'es2020',
        cssCodeSplit: true,
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (id.includes('react-dom') || id.match(/[\\/]react[\\/]/) || id.includes('scheduler')) return 'react-vendor';
                    if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor') || id.includes('internmap')) return 'charts';
                    if (id.includes('topojson') || id.includes('world-atlas')) return 'maps';
                    // jspdf/html2canvas/dompurify intentionally not in manualChunks so they
                    // stay in the async DocumentGenerator chunk and don't trigger modulepreload
                    if (id.includes('@supabase')) return 'supabase';
                    if (id.includes('lucide-react')) return 'icons';
                }
            }
        }
    }
})
