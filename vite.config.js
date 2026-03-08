import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            '/api/nta': {
                target: 'https://api.excelapi.org',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/nta/, ''),
            },
        },
    },
});
