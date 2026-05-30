<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Specialty extends Model
{
    protected $guarded = [];

    public function doctorProfiles()
    {
        return $this->hasMany(DoctorProfile::class);
    }
}
