<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * Users the authenticated user can start or continue a conversation with.
     */
    public function contacts(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'doctor') {
            $patientIds = Appointment::where('doctor_id', $user->id)
                ->pluck('patient_id')
                ->unique()
                ->filter()
                ->values();

            $contacts = User::whereIn('id', $patientIds)
                ->get(['id', 'name', 'email', 'role']);
        } else {
            $doctorIds = Appointment::where('patient_id', $user->id)
                ->pluck('doctor_id')
                ->unique()
                ->filter()
                ->values();

            $contacts = User::whereIn('id', $doctorIds)
                ->where('role', 'doctor')
                ->get(['id', 'name', 'email', 'role']);
        }

        return response()->json($contacts);
    }

    /**
     * All messages for the current user (sent and received).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $messages = Message::with(['sender:id,name,email,role', 'receiver:id,name,email,role'])
            ->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'required|string|max:5000',
        ]);

        $user = $request->user();

        if ((int) $validated['receiver_id'] === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas vous envoyer un message.'], 422);
        }

        $receiver = User::findOrFail($validated['receiver_id']);

        if ($user->role === 'doctor') {
            if ($receiver->role !== 'patient') {
                return response()->json(['message' => 'Destinataire invalide.'], 422);
            }

            $isPatient = Appointment::where('doctor_id', $user->id)
                ->where('patient_id', $receiver->id)
                ->exists();

            if (!$isPatient) {
                return response()->json([
                    'message' => 'Vous ne pouvez envoyer des messages qu\'à vos patients.',
                ], 403);
            }
        }

        if ($user->role === 'patient') {
            if ($receiver->role !== 'doctor') {
                return response()->json(['message' => 'Destinataire invalide.'], 422);
            }
        }

        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $validated['receiver_id'],
            'content' => trim($validated['content']),
        ]);

        return response()->json(
            $message->load(['sender:id,name,email,role', 'receiver:id,name,email,role']),
            201
        );
    }
}
