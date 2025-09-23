import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/kanban.css',
                'resources/js/kanban/index.js'
            ],
            refresh: true,
        }),
        tailwindcss(),
    ],
});
