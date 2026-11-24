import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Supabase keys use public prefixes for both the Vite prototype and Next.js helpers.
export default defineConfig({ plugins: [react()], envPrefix: ['VITE_', 'NEXT_PUBLIC_'] });
