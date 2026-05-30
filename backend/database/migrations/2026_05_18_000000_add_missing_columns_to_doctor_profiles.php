<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('doctor_profiles')) {
            Schema::table('doctor_profiles', function (Blueprint $table) {
                if (!Schema::hasColumn('doctor_profiles', 'price')) {
                    $table->decimal('price', 8, 2)->nullable()->after('specialty_id');
                }
                if (!Schema::hasColumn('doctor_profiles', 'available')) {
                    $table->boolean('available')->default(true)->after('city');
                }
                if (!Schema::hasColumn('doctor_profiles', 'rating')) {
                    $table->decimal('rating', 3, 2)->default(0)->after('available');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('doctor_profiles')) {
            Schema::table('doctor_profiles', function (Blueprint $table) {
                if (Schema::hasColumn('doctor_profiles', 'price')) {
                    $table->dropColumn('price');
                }
                if (Schema::hasColumn('doctor_profiles', 'available')) {
                    $table->dropColumn('available');
                }
                if (Schema::hasColumn('doctor_profiles', 'rating')) {
                    $table->dropColumn('rating');
                }
            });
        }
    }
};
