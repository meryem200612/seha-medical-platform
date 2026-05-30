<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Specialty;
use App\Models\DoctorProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        $specialties = [
            ['name' => 'Dentiste', 'icon' => '🦷'],
            ['name' => 'Ophtalmologue', 'icon' => '👁️'],
            ['name' => 'Cardiologue', 'icon' => '❤️'],
            ['name' => 'Pédiatrie', 'icon' => '👶'],
            ['name' => 'Neurologie', 'icon' => '🧠'],
            ['name' => 'Orthopédiste', 'icon' => '🦴'],
            ['name' => 'Généraliste', 'icon' => '🩺'],
            ['name' => 'Dermatologie', 'icon' => '🧴'],
        ];

        $names = [
            'Youssef Alaoui', 'Amine Benjelloun', 'Fatima-Zahra Mansouri', 'Karim Tazi', 
            'Meriem El Fassi', 'Omar Bennis', 'Sara Chraibi', 'Mehdi Kettani', 
            'Salma Bennani', 'Tarik Oufkir', 'Kenza Lahlou', 'Hassan El Glaoui'
        ];

        $cities = [
            'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Oujda', 'Kenitra'
        ];

        $i = 0;
        foreach ($specialties as $s) {
            $specialty = Specialty::firstOrCreate(['name' => $s['name']], $s);

            // Create 2 doctors for each specialty
            for ($j = 0; $j < 2; $j++) {
                $name = $names[$i % count($names)];
                $city = $cities[$i % count($cities)];
                
                $user = User::create([
                    'name' => $name,
                    'email' => 'dr.' . strtolower(str_replace(' ', '', $name)) . $i . '@seha.com',
                    'password' => Hash::make('password'),
                    'role' => 'doctor',
                ]);

                DoctorProfile::create([
                    'user_id' => $user->id,
                    'specialty_id' => $specialty->id,
                    'price' => rand(2, 6) * 100, // 200, 300, 400, 500, 600
                    'bio' => 'Médecin spécialiste certifié avec plus de ' . rand(5, 25) . ' ans d\'expérience au Maroc.',
                    'experience_years' => rand(5, 25),
                    'city' => $city,
                    'address' => 'Centre Médical ' . $city,
                    'available' => rand(0, 3) !== 0, // 75% available
                    'rating' => round(rand(40, 50) / 10, 1),
                ]);
                $i++;
            }
        }
    }
}

