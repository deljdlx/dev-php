<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class LivewireClickCounterTest extends TestCase
{
    /** @test */
    public function it_displays_the_livewire_click_counter_page(): void
    {
        $response = $this->get('/test/counter');

        $response->assertOk();
        $response->assertSee('Compteur Livewire');
        $response->assertSee('Cliquez sur + ou - pour modifier le compteur en direct.');
    }
}
