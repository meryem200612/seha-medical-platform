<?php

namespace App\Http\Controllers;

use App\Models\Medication;
use Illuminate\Http\Request;

class MedicationController extends Controller
{
    private function ensurePatientSubscribed(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'patient') {
            return response()->json(['message' => 'Accès interdit.'], 403);
        }

        if (!optional($user->patientProfile)->medication_subscription_active) {
            return response()->json(['message' => 'Abonnement nécessaire pour accéder aux rappels de médicaments.'], 403);
        }

        return $user;
    }

    public function index(Request $request)
    {
        $user = $this->ensurePatientSubscribed($request);
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $medications = Medication::where('patient_id', $user->id)
            ->orderBy('reminder_time')
            ->get();

        return response()->json($medications);
    }

    public function store(Request $request)
    {
        $user = $this->ensurePatientSubscribed($request);
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $validated = $request->validate([
            'medicine_name' => 'required|string|max:255',
            'dosage' => 'required|string|max:255',
            'reminder_time' => 'required|date_format:H:i',
            'notes' => 'nullable|string',
        ]);

        $medication = Medication::create([
            'patient_id' => $user->id,
            'medicine_name' => $validated['medicine_name'],
            'dosage' => $validated['dosage'],
            'reminder_time' => $validated['reminder_time'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json($medication, 201);
    }

    public function update(Request $request, $id)
    {
        $user = $this->ensurePatientSubscribed($request);
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $medication = Medication::where('patient_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'medicine_name' => 'required|string|max:255',
            'dosage' => 'required|string|max:255',
            'reminder_time' => 'required|date_format:H:i',
            'notes' => 'nullable|string',
        ]);

        $medication->update($validated);

        return response()->json($medication);
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->ensurePatientSubscribed($request);
        if ($user instanceof \Illuminate\Http\JsonResponse) {
            return $user;
        }

        $medication = Medication::where('patient_id', $user->id)->findOrFail($id);
        $medication->delete();

        return response()->json(['message' => 'Médication supprimée avec succès.']);
    }
}
