<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\MedicationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/doctors', [DoctorController::class, 'index']);
Route::get('/doctors/{id}', [DoctorController::class, 'show']);
Route::get('/specialties', [DoctorController::class, 'specialties']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::get('/doctor/dashboard', [DoctorController::class, 'dashboard']);
    Route::get('/doctor/reviews', [DoctorController::class, 'getReviews']);
    Route::get('/doctor/programs', [DoctorController::class, 'programs']);
    Route::get('/programmes', [DoctorController::class, 'programs']);
    Route::get('/programs', [DoctorController::class, 'programs']);
    Route::get('/doctor/programs/{id}', [DoctorController::class, 'showProgram']);
    Route::get('/programmes/{id}', [DoctorController::class, 'showProgram']);
    Route::get('/programs/{id}', [DoctorController::class, 'showProgram']);
    Route::post('/programmes/{id}/buy', [DoctorController::class, 'buyProgram']);
    Route::post('/programs/{id}/buy', [DoctorController::class, 'buyProgram']);
    Route::post('/doctor/programs', [DoctorController::class, 'storeProgram']);
    Route::put('/doctor/programs/{id}', [DoctorController::class, 'updateProgram']);
    Route::post('/doctors/{id}/reviews', [DoctorController::class, 'storeReview']);
    Route::put('/patient/profile', [\App\Http\Controllers\PatientController::class, 'updateProfile']);
    Route::post('/patient/medication-subscription', [\App\Http\Controllers\PatientController::class, 'subscribeMedications']);
    Route::post('/patient/medication-subscription/cancel', [\App\Http\Controllers\PatientController::class, 'cancelMedicationSubscription']);
    Route::get('/patient/history', [\App\Http\Controllers\PatientController::class, 'getHistory']);

    Route::get('/medications', [MedicationController::class, 'index']);
    Route::post('/medications', [MedicationController::class, 'store']);
    Route::put('/medications/{id}', [MedicationController::class, 'update']);
    Route::delete('/medications/{id}', [MedicationController::class, 'destroy']);

    // ── Photo upload ──────────────────────────────────────────────────────────
    Route::post('/doctor/profile/photo', [DoctorController::class, 'uploadPhoto']);
    Route::post('/patient/profile/photo', [\App\Http\Controllers\PatientController::class, 'uploadPhoto']); // ← NEW

    Route::post('/video/join', [\App\Http\Controllers\VideoCallController::class, 'join']);
    Route::get('/messages/contacts', [\App\Http\Controllers\MessageController::class, 'contacts']);
    Route::get('/messages', [\App\Http\Controllers\MessageController::class, 'index']);
    Route::post('/messages', [\App\Http\Controllers\MessageController::class, 'store']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');