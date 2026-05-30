<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;

class VideoCallController extends Controller
{
    /**
     * Verify the user may join a video room and return PeerJS room metadata.
     */
    public function join(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'doctor_id' => 'required|integer|exists:users,id',
            'patient_id' => 'nullable|integer|exists:users,id',
        ]);

        $doctor = User::where('id', $validated['doctor_id'])->where('role', 'doctor')->first();
        if (!$doctor) {
            return response()->json(['message' => 'Médecin introuvable.'], 404);
        }

        $patientId = $validated['patient_id'] ?? null;

        if ($user->role === 'patient') {
            $patientId = $user->id;
        } elseif ($user->role === 'doctor') {
            if ((int) $doctor->id !== (int) $user->id) {
                return response()->json(['message' => 'Accès non autorisé.'], 403);
            }
            if (!$patientId) {
                return response()->json([
                    'peer_id' => 'seha-doctor-' . $user->id,
                    'role' => 'doctor',
                    'doctor_id' => $user->id,
                    'mode' => 'lobby',
                ]);
            }
        } else {
            return response()->json(['message' => 'Rôle non autorisé.'], 403);
        }

        $hasAppointment = Appointment::where('doctor_id', $doctor->id)
            ->where('patient_id', $patientId)
            ->whereIn('status', ['confirmed', 'pending'])
            ->exists();

        if (!$hasAppointment) {
            return response()->json([
                'message' => 'Aucun rendez-vous valide trouvé entre ce patient et ce médecin.',
            ], 422);
        }

        $patient = User::find($patientId);

        return response()->json([
            'peer_id' => $user->role === 'doctor'
                ? 'seha-doctor-' . $doctor->id
                : null,
            'target_peer_id' => $user->role === 'doctor'
                ? 'seha-patient-' . $patientId
                : 'seha-doctor-' . $doctor->id,
            'role' => $user->role,
            'doctor_id' => $doctor->id,
            'patient_id' => $patientId,
            'doctor_name' => $doctor->name,
            'patient_name' => $patient?->name,
            'mode' => 'call',
        ]);
    }
}
