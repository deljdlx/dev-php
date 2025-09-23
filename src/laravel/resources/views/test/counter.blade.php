<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Test Compteur Livewire</title>
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles
    </head>
    <body class="min-h-screen bg-gray-50 text-gray-900 p-8">
        <div class="mx-auto max-w-2xl">
            <a href="/" class="text-sm text-blue-600 underline">← Accueil</a>
            <div class="mt-6 bg-white shadow rounded p-6">
                @livewire('click-counter')
            </div>
        </div>

        @livewireScripts
    </body>
    </html>
