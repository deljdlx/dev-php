<?php
use App\Http\Controllers\Api\PostController;
use Illuminate\Support\Facades\Route;

// IMPORTANT make api controller
// php artisan make:controller Api/PostController --api --model="Post"
Route::middleware('api')
    ->group(function () {
        // Route::get('users/test', [PharmacieController::class, 'test']);
        Route::apiResource('posts', PostController::class)
            // ->parameters(['post' => 'something_else']) // Optional: Customize the route parameter name
            ->whereNumber('post');
    });