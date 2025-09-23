<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test/counter', function () {
    return view('test.counter');
})->name('test.counter');
