<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\Program;
use App\Models\ProgramPurchase;
use App\Models\Review;
use App\Models\Specialty;
use App\Support\DoctorPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DoctorController extends Controller
{
    private function formatPublicDoctor(DoctorProfile $profile): array
    {
        $specialty = $profile->getRelation('specialty');
        $specialtyName = optional($specialty)->name ?? 'Médecin';

        return [
            'id' => $profile->user->id,
            'user_id' => $profile->user->id,
            'profile_id' => $profile->id,
            'name' => $profile->user->name,
            'specialty_id' => $profile->specialty_id,
            'specialty' => $specialty
                ? ['id' => $specialty->id, 'name' => $specialty->name]
                : null,
            'specialty_name' => $specialtyName,
            'price' => $profile->price,
            'consultation_fee' => $profile->consultation_fee,
            'photo_url' => DoctorPhoto::forProfile($profile),
            'average_rating' => $profile->rating,
            'rating' => $profile->rating,
        ];
    }

    public function index(Request $request)
    {
        $query = DoctorProfile::with(['user', 'specialty']);

        // Filter by specialty id (source of truth). Keep name fallback for legacy clients.
        if ($request->filled('specialty_id')) {
            $query->where('specialty_id', (int) $request->specialty_id);
        } elseif ($request->filled('specialty')) {
            $query->whereHas('specialty', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->specialty . '%');
            });
        }

        // Filter by city
        if ($request->has('city') && $request->city !== '') {
            $query->where('city', 'like', '%' . $request->city . '%');
        }

        // Filter by price range
        if ($request->has('price') && $request->price !== '') {
            switch ($request->price) {
                case 'low':
                    $query->where('price', '<', 300);
                    break;
                case 'medium':
                    $query->whereBetween('price', [300, 600]);
                    break;
                case 'high':
                    $query->where('price', '>', 600);
                    break;
            }
        }

        // Filter by min price (legacy support)
        if ($request->has('price_min') && $request->price_min !== '') {
            $query->where('price', '>=', $request->price_min);
        }

        // Filter by max price (legacy support)
        if ($request->has('price_max') && $request->price_max !== '') {
            $query->where('price', '<=', $request->price_max);
        }

        // Filter by availability
        if ($request->has('available') && $request->available === 'true') {
            $query->where('available', true);
        }

        // Filter by minimum rating
        if ($request->has('rating') && $request->rating !== 0 && $request->rating !== '0') {
            $query->where('rating', '>=', $request->rating);
        }

        // Search by doctor name (in users table)
        if ($request->has('search') && $request->search !== '') {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        // Sorting
        if ($request->has('sort')) {
            switch ($request->sort) {
                case 'price_asc':
                    $query->orderBy('price', 'asc');
                    break;
                default:
                    $query->latest();
            }
        } else {
            $query->latest();
        }

        // Only show users with role = doctor
        $query->whereHas('user', function($q) {
            $q->where('role', 'doctor');
        });

        $perPage = min(max((int) $request->input('per_page', 12), 1), 50);
        $page = max((int) $request->input('page', 1), 1);
        $doctors = $query->paginate($perPage, ['*'], 'page', $page);

        // Return only needed fields with consistent id/specialty mapping
        $doctors->getCollection()->transform(fn ($profile) => $this->formatPublicDoctor($profile));

        return response()->json([
            'data' => $doctors->items(),
            'current_page' => $doctors->currentPage(),
            'last_page' => $doctors->lastPage(),
            'per_page' => $doctors->perPage(),
            'total' => $doctors->total(),
            'from' => $doctors->firstItem(),
            'to' => $doctors->lastItem(),
            'links' => $doctors->linkCollection()->toArray(),
        ]);
    }

    public function show($id)
    {
        $doctor = DoctorProfile::with(['user', 'specialty'])
            ->where('user_id', $id)
            ->firstOrFail();

        $reviews = Review::with('patient')
            ->where('doctor_id', $doctor->user_id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'patient_name' => $review->patient?->name ?? 'Patient',
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => optional($review->created_at)->toDateString(),
                ];
            });

        $specialty = $doctor->getRelation('specialty');
        $specialtyName = optional($specialty)->name ?? 'Médecin';

        return response()->json(array_merge($this->formatPublicDoctor($doctor), [
            'user' => $doctor->user
                ? $doctor->user->only(['id', 'name', 'email', 'role'])
                : null,
            'specialty_name' => $specialtyName,
            'reviews' => $reviews,
            'reviews_count' => $reviews->count(),
        ]));
    }

    public function storeReview(Request $request, $id)
    {
        $doctor = DoctorProfile::with('user')
            ->where('user_id', $id)
            ->firstOrFail();

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $authUser = $request->user();
        if (!$authUser) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }

        $appointment = Appointment::where('doctor_id', $doctor->user_id)
            ->where('patient_id', $authUser->id)
            ->whereIn('status', ['confirmed', 'pending'])
            ->latest('id')
            ->first();

        if (!$appointment) {
            return response()->json([
                'message' => 'No valid appointment found for this doctor and patient. Please book a consultation first.',
            ], 422);
        }

        $review = Review::create([
            'doctor_id' => $doctor->user_id,
            'patient_id' => $authUser->id,
            'appointment_id' => $appointment->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return response()->json([
            'id' => $review->id,
            'patient_name' => $authUser->name ?? 'Patient',
            'rating' => $review->rating,
            'comment' => $review->comment,
            'created_at' => optional($review->created_at)->toDateString(),
        ], 201);
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $doctorId = $user->id;
        $today = now()->toDateString();
        $currentYear = now()->year;
        $currentMonth = now()->month;

        $appointmentsThisMonth = Appointment::where('doctor_id', $doctorId)
            ->whereYear('date', $currentYear)
            ->whereMonth('date', $currentMonth)
            ->count();

        $revenueThisMonth = Appointment::where('doctor_id', $doctorId)
            ->whereYear('date', $currentYear)
            ->whereMonth('date', $currentMonth)
            ->sum('price');

        $averageRating = Review::where('doctor_id', $doctorId)->avg('rating') ?? 0;

        $upcomingToday = Appointment::where('doctor_id', $doctorId)
            ->where('date', $today)
            ->count();

        $programsCount = Program::where('doctor_id', $doctorId)->count();
        $patientsCount = Appointment::where('doctor_id', $doctorId)
            ->distinct('patient_id')
            ->count('patient_id');

        $programSalesCount = ProgramPurchase::where('doctor_id', $doctorId)->count();
        $programRevenueThisMonth = ProgramPurchase::where('doctor_id', $doctorId)
            ->whereYear('created_at', $currentYear)
            ->whereMonth('created_at', $currentMonth)
            ->sum('amount');
        $programRevenueTotal = ProgramPurchase::where('doctor_id', $doctorId)->sum('amount');

        $soldPrograms = ProgramPurchase::with('program')
            ->where('doctor_id', $doctorId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'program_id' => $purchase->program_id,
                    'program_title' => $purchase->program?->title,
                    'amount' => $purchase->amount,
                    'patient_id' => $purchase->patient_id,
                    'purchased_at' => optional($purchase->created_at)->toDateTimeString(),
                ];
            });

        $upcomingAppointments = Appointment::with('patient')
            ->where('doctor_id', $doctorId)
            ->where('date', '>=', $today)
            ->orderBy('date', 'asc')
            ->limit(4)
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'patient_name' => $appointment->patient?->name,
                    'date' => $appointment->date,
                    'time_slot' => $appointment->time_slot,
                    'status' => $appointment->status,
                    'type' => $appointment->type,
                    'price' => $appointment->price,
                ];
            });

        $recentReviews = Review::with('patient')
            ->where('doctor_id', $doctorId)
            ->orderBy('created_at', 'desc')
            ->limit(4)
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'patient_name' => $review->patient?->name,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at->toDateTimeString(),
                ];
            });

        return response()->json([
            'stats' => [
                'appointments_this_month' => $appointmentsThisMonth,
                'revenue_this_month' => $revenueThisMonth + $programRevenueThisMonth,
                'average_rating' => round($averageRating, 1),
                'upcoming_today' => $upcomingToday,
                'programs_count' => $programsCount,
                'patients_count' => $patientsCount,
                'program_sales_count' => $programSalesCount,
                'program_revenue_total' => $programRevenueTotal,
            ],
            'program_sales' => [
                'this_month' => $programRevenueThisMonth,
                'total' => $programRevenueTotal,
                'items' => $soldPrograms,
            ],
            'upcoming_appointments' => $upcomingAppointments,
            'recent_reviews' => $recentReviews,
        ]);
    }

    public function programs(Request $request)
    {
        $user = $request->user();
        $query = Program::with('doctor.doctorProfile.specialty')
            ->orderBy('created_at', 'desc');

        if ($user->role === 'doctor') {
            $query->where('doctor_id', $user->id);
        }

        $programs = $query->get()->map(function ($program) {
            $doctor = $program->doctor;
            $specialtyName = $doctor?->doctorProfile?->specialty?->name;

            return [
                'id' => $program->id,
                'title' => $program->title,
                'category' => $program->category,
                'description' => $program->description,
                'price' => $program->price,
                'duration_weeks' => $program->duration_weeks,
                'content' => $program->content,
                'created_at' => optional($program->created_at)->toDateTimeString(),
                'image_url' => $program->image_url ?? null,
                'doctor' => $doctor ? [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialty' => $specialtyName,
                ] : null,
            ];
        });

        return response()->json($programs);
    }

    public function storeProgram(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'doctor') {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'specialty' => 'required|string|max:255',
            'description' => 'required|string',
            'content' => 'required|string',
            'price' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:1',
        ]);

        $doctorId = $user->id;

        $program = Program::create([
            'doctor_id' => $doctorId,
            'title' => $validated['name'],
            'category' => $validated['specialty'],
            'description' => $validated['description'],
            'content' => $validated['content'],
            'price' => $validated['price'],
            'duration_weeks' => $validated['duration'],
        ]);

        return response()->json($program, 201);
    }

    public function showProgram(Request $request, $id)
    {
        $program = Program::with('doctor.doctorProfile.specialty')->find($id);

        if (!$program) {
            return response()->json(['message' => 'Programme introuvable.'], 404);
        }

        $doctor = $program->doctor;
        $specialtyName = $doctor?->doctorProfile?->specialty?->name;

        return response()->json([
            'id' => $program->id,
            'title' => $program->title,
            'category' => $program->category,
            'description' => $program->description,
            'content' => $program->content,
            'price' => $program->price,
            'duration_weeks' => $program->duration_weeks,
            'created_at' => optional($program->created_at)->toDateTimeString(),
            'image_url' => $program->image_url ?? null,
            'doctor' => $doctor ? [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'specialty' => $specialtyName,
            ] : null,
        ]);
    }

    public function buyProgram(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'patient') {
            return response()->json(['message' => 'Seuls les patients peuvent acheter un programme.'], 403);
        }

        $program = Program::find($id);
        if (!$program) {
            return response()->json(['message' => 'Programme introuvable.'], 404);
        }

        if ($program->doctor_id === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas acheter votre propre programme.'], 403);
        }

        $alreadyPurchased = ProgramPurchase::where('patient_id', $user->id)
            ->where('program_id', $program->id)
            ->exists();

        if ($alreadyPurchased) {
            return response()->json(['message' => 'Ce programme a deja ete achete.'], 409);
        }

        $purchase = ProgramPurchase::create([
            'patient_id' => $user->id,
            'doctor_id' => $program->doctor_id,
            'program_id' => $program->id,
            'amount' => $program->price,
        ]);

        return response()->json([
            'id' => $purchase->id,
            'patient_id' => $purchase->patient_id,
            'doctor_id' => $purchase->doctor_id,
            'program_id' => $purchase->program_id,
            'amount' => $purchase->amount,
            'created_at' => optional($purchase->created_at)->toDateTimeString(),
        ], 201);
    }

    public function updateProgram(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'doctor') {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $program = Program::find($id);
        if (!$program) {
            return response()->json(['message' => 'Programme introuvable.'], 404);
        }

        if ($program->doctor_id !== $user->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'specialty' => 'required|string|max:255',
            'description' => 'required|string',
            'content' => 'required|string',
            'price' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:1',
        ]);

        $program->update([
            'title' => $validated['name'],
            'category' => $validated['specialty'],
            'description' => $validated['description'],
            'content' => $validated['content'],
            'price' => $validated['price'],
            'duration_weeks' => $validated['duration'],
        ]);

        return response()->json($program);
    }

    public function specialties()
    {
        return response()->json(Specialty::all());
    }

    public function getReviews(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'doctor') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $reviews = Review::with('patient')
            ->where('doctor_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'patient_name' => $review->patient?->name ?? 'Patient',
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at->toDateTimeString(),
                ];
            });

        return response()->json($reviews);
    }

    public function uploadPhoto(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'doctor') {
            return response()->json(['message' => 'Réservé aux médecins.'], 403);
        }

        $validated = $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        $profile = $user->doctorProfile;
        if (!$profile) {
            return response()->json(['message' => 'Profil médecin introuvable.'], 404);
        }

        if ($profile->photo_path) {
            Storage::disk('public')->delete($profile->photo_path);
        }

        $path = $validated['photo']->store('doctor-photos', 'public');
        $profile->update(['photo_path' => $path]);

        return response()->json([
            'message' => 'Photo mise à jour.',
            'photo_url' => DoctorPhoto::url($path),
            'photo_path' => $path,
        ]);
    }
}
