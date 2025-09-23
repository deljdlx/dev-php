<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(

        using: function () {
            // Web (si tu en as)
            Route::middleware('web')
                ->group(base_path('routes/web.php'));
            Route::middleware('command')
                ->group(base_path('routes/console.php'));
            Route::middleware('api')
                ->prefix('app/api')
                ->group(base_path('routes/api.php'));
        },
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
