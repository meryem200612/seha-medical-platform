<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DoctorProfile extends Model
{
    protected $guarded = [];

    protected $fillable = [
        'user_id',
        'specialty_id',
        'price',
        'bio',
        'experience_years',
        'consultation_fee',
        'address',
        'city',
        'photo_path',
        'available',
        'rating',
    ];

    protected $appends = ['photo_url'];

    protected function casts(): array
    {
        return [
            'specialty_id' => 'integer',
            'available' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function specialty()
    {
        return $this->belongsTo(Specialty::class, 'specialty_id');
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return \App\Support\DoctorPhoto::url($this->photo_path);
    }
}
