<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /** @use HasFactory<\Database\Factories\PostFactory> */
    use HasFactory;
    
    protected $fillable = [
        'title', 'content', 'published',
    ];

    public function scopeId($query, $id)
    {
        return $query->where('id', $id);
    }
}
