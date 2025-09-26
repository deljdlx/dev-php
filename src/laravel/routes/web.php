<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test/counter', function () {
    return view('test.counter');
})->name('test.counter');

Route::get('/test/kanban', function () {
    return view('test.kanban');
})->name('test.kanban');

Route::get('/test/tabulator', function () {
    return view('test.tabulator');
})->name('test.tabulator');
