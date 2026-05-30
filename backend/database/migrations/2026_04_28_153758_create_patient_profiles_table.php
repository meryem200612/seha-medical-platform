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
        Schema::create('patient_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('age')->nullable();
            $table->string('gender')->nullable();
            $table->string('city')->nullable();
            $table->string('phone')->nullable();
            $table->string('blood_group')->nullable();
            $table->text('allergies')->nullable();
            
            // Vitals (default to 0 or appropriate placeholders)
            $table->integer('heart_rate')->default(0);
            $table->string('blood_pressure')->default('0/0');
            $table->float('temperature')->default(0);
            $table->float('weight')->default(0);
            $table->integer('oxygen_saturation')->default(0);
            $table->float('glycemia')->default(0);
            
            $table->text('medical_history')->nullable();
            $table->text('current_treatments')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_profiles');
    }
};
