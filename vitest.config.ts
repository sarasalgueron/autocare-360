import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        // jsdom simula el DOM del navegador para montar componentes React
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
    },
});
