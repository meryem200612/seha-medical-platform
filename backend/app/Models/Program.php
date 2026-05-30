<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Program extends Model
{
    protected $fillable = [
        'doctor_id',
        'title',
        'category',
        'description',
        'content',
        'price',
        'duration_weeks',
        'image_url',
    ];

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function purchases()
    {
        return $this->hasMany(ProgramPurchase::class, 'program_id');
    }
}
