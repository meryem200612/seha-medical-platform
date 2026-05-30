<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'doctor_id' => 'required|integer|exists:users,id',
            'date' => 'required|date',
            'time_slot' => 'required|string|max:50',
            'type' => 'required|in:video,in-person',
            'price' => 'required|numeric|min:0',
        ]);

        $doctorExists = DoctorProfile::where('user_id', $validated['doctor_id'])->exists();
        if (!$doctorExists) {
            return response()->json(['message' => 'Selected doctor profile not found.'], 422);
        }

        $appointment = Appointment::create([
            'patient_id' => $user->id,
            'doctor_id' => $validated['doctor_id'],
            'date' => $validated['date'],
            'time_slot' => $validated['time_slot'],
            'status' => 'confirmed',
            'type' => $validated['type'],
            'price' => $validated['price'],
        ]);

        return response()->json($appointment, 201);
    }
}
