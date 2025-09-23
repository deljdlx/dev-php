<?php

namespace App\Livewire;

use Livewire\Component;

class ClickCounter extends Component
{
    public int $count = 0;

    public function increment(): void
    {
        $this->count++;
    }

    public function decrement(): void
    {
        $this->count--;
    }

    public function resetCount(): void
    {
        $this->count = 0;
    }

    public function render()
    {
        return view('livewire.click-counter');
    }
}
