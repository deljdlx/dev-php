<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ExampleTest extends DuskTestCase
{
    /**
     * A basic browser test example.
     */
    public function testBasicExample(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://myurgo.test')
            ->pause(2000)
            ->screenshot('welcome-page')
            ->assertSee('MyUrgo.fr')

            // click on link "Connexion en tant qu'individu"
            ->click('a.connexion-individu')
            ->pause(5000)

            ;

        });
    }
}
