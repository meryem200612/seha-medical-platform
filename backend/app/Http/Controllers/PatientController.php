<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;
use App\Models\PatientProfile;
use Illuminate\Support\Facades\Storage;

class PatientController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'age' => 'nullable|integer',
            'gender' => 'nullable|string',
            'city' => 'nullable|string',
            'phone' => 'nullable|string',
            'blood_group' => 'nullable|string',
            'allergies' => 'nullable|string',
            'heart_rate' => 'nullable|integer',
            'blood_pressure' => 'nullable|string',
            'temperature' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'oxygen_saturation' => 'nullable|integer',
            'glycemia' => 'nullable|numeric',
            'medical_history' => 'nullable|string',
            'current_treatments' => 'nullable|string',
        ]);

        $profile = $user->patientProfile;

        if (!$profile) {
            $profile = $user->patientProfile()->create($validated);
        } else {
            $profile->update($validated);
        }

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => $user->load('patientProfile'),
        ]);
    }

    /**
     * Upload / replace patient profile photo.
     * Route: POST /api/patient/profile/photo  (add this in api.php)
     */
    public function uploadPhoto(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'patient') {
            return response()->json(['message' => 'Réservé aux patients.'], 403);
        }

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        $profile = $user->patientProfile;
        if (!$profile) {
            $profile = $user->patientProfile()->create([]);
        }

        // Delete old photo if exists
        if (!empty($profile->photo_path)) {
            Storage::disk('public')->delete($profile->photo_path);
        }

        $path = $request->file('photo')->store('patient-photos', 'public');
        $profile->update(['photo_path' => $path]);

        $photoUrl = Storage::disk('public')->url($path);

        return response()->json([
            'message' => 'Photo mise à jour.',
            'photo_url' => $photoUrl,
            'photo_path' => $path,
        ]);
    }

    public function getHistory(Request $request)
    {
        $user = $request->user();

        $appointments = Appointment::where('patient_id', $user->id)
            ->with(['doctor.doctorProfile.specialty'])
            ->orderBy('date', 'desc')
            ->get();

        $prescriptions = \App\Models\Prescription::where('patient_id', $user->id)
            ->with(['doctor', 'appointment'])
            ->orderBy('created_at', 'desc')
            ->get();

        $analyses = \App\Models\Analysis::where('patient_id', $user->id)
            ->orderBy('date', 'desc')
            ->get();

        $doctorIds = $appointments->pluck('doctor_id')->unique()->filter()->values();
        $doctors = User::whereIn('id', $doctorIds)
            ->where('role', 'doctor')
            ->with('doctorProfile.specialty')
            ->orderBy('name')
            ->get()
            ->map(function (User $doctor) {
                $spec = $doctor->doctorProfile?->specialty;
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialty' => $spec
                        ? ['id' => $spec->id, 'name' => $spec->name]
                        : null,
                ];
            })
            ->values();

        return response()->json([
            'appointments' => $appointments,
            'prescriptions' => $prescriptions,
            'analyses' => $analyses,
            'doctors' => $doctors,
        ]);
    }

    public function subscribeMedications(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'patient') {
            return response()->json(['message' => 'Accès interdit.'], 403);
        }

        $profile = $user->patientProfile;
        if (!$profile) {
            $profile = $user->patientProfile()->create([
                'heart_rate' => 0,
                'blood_pressure' => '0/0',
                'temperature' => 0,
                'weight' => 0,
                'oxygen_saturation' => 0,
                'glycemia' => 0,
                'medication_subscription_active' => true,
            ]);
        } else {
            $profile->update(['medication_subscription_active' => true]);
        }

        return response()->json([
            'message' => 'Abonnement aux rappels de médicaments activé.',
            'user' => $user->load('patientProfile'),
        ]);
    }

    public function cancelMedicationSubscription(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'patient') {
            return response()->json(['message' => 'Accès interdit.'], 403);
        }

        $profile = $user->patientProfile;
        if (!$profile) {
            return response()->json(['message' => 'Aucun profil patient trouvé.'], 404);
        }

        $profile->update(['medication_subscription_active' => false]);

        return response()->json([
            'message' => 'Abonnement aux rappels de médicaments annulé.',
            'user' => $user->load('patientProfile'),
        ]);
    }
}
