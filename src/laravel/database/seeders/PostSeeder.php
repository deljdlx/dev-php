<?php

namespace Database\Seeders;

use App\Models\Post;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        if (Post::query()->count() === 0) {
            Post::factory()->count(20)->create();
        }
    }
}
