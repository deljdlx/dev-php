import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        hmr: { host: 'web.localhost', port: 5173 },
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/js/kanban/index.js',
                'resources/js/tabulator-demo.js',
                'resources/css/tabulator-demo.css'
            ],
            refresh: true,
        }),
        tailwindcss(),
    ],
});
