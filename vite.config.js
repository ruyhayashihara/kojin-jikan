import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true,
        proxy: {
            '/api/nta': {
                target: 'https://api.excelapi.org',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/nta/, ''),
            },
        },
    },
});
