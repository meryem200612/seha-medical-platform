<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\DoctorProfile;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing data: set specialty string from specialty_id
        DoctorProfile::with('specialty')->chunk(100, function ($profiles) {
            foreach ($profiles as $profile) {
                $profile->update(['specialty' => $profile->specialty->name ?? 'General']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed
    }
};
