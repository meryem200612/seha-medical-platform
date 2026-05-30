<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:patient,doctor',
            'specialty_id' => 'required_if:role,doctor|exists:specialties,id',
            'price' => 'required_if:role,doctor|numeric|min:0',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        if ($user->role === 'patient') {
            $user->patientProfile()->create([
                'heart_rate' => 0,
                'blood_pressure' => '0/0',
                'temperature' => 0,
                'weight' => 0,
                'oxygen_saturation' => 0,
                'glycemia' => 0,
                'medication_subscription_active' => false,
            ]);
        } elseif ($user->role === 'doctor') {
            $user->doctorProfile()->create([
                'specialty_id' => $request->specialty_id,
                'price' => $request->price,
                'available' => true,
                'rating' => 0,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->loadUserRelations($user),
        ]);
    }

    private function loadUserRelations(User $user)
    {
        if ($user->role === 'doctor') {
            return $user->load('doctorProfile.specialty');
        }

        return $user->load('patientProfile');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->loadUserRelations($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($this->loadUserRelations($request->user()));
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'specialty_id' => 'nullable|exists:specialties,id',
            'price' => 'nullable|numeric|min:0',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($user->role === 'doctor') {
            $doctorProfileData = [];
            if (array_key_exists('specialty_id', $validated)) {
                $doctorProfileData['specialty_id'] = $validated['specialty_id'] !== null
                    ? (int) $validated['specialty_id']
                    : null;
            }
            if (array_key_exists('price', $validated)) {
                $doctorProfileData['price'] = $validated['price'];
            }
            if ($doctorProfileData !== []) {
                $user->doctorProfile()->updateOrCreate(
                    ['user_id' => $user->id],
                    $doctorProfileData
                );
            }
        }

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'user' => $this->loadUserRelations($user),
        ]);
    }
}
