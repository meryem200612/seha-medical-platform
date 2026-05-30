<?php

namespace App\Models;

use App\Models\Program;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ProgramPurchase extends Model
{
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'program_id',
        'amount',
    ];

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function program()
    {
        return $this->belongsTo(Program::class, 'program_id');
    }
}
