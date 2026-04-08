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
    }
})
