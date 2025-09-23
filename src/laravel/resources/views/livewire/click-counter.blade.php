<div class="max-w-md mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Compteur Livewire</h1>

    <div class="flex items-center gap-4 mb-6">
        <button wire:click="decrement" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">-</button>
        <span class="text-xl font-mono">{{ $count }}</span>
        <button wire:click="increment" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+</button>
        <button wire:click="resetCount" class="ml-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Reset</button>
    </div>

    <p class="text-gray-600">Cliquez sur + ou - pour modifier le compteur en direct.</p>
</div>
