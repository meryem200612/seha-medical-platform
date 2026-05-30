<?php

namespace App\Support;

use App\Models\DoctorProfile;
use Illuminate\Support\Facades\Storage;

class DoctorPhoto
{
    public static function url(?string $photoPath): ?string
    {
        if (!$photoPath) {
            return null;
        }

        if (str_starts_with($photoPath, 'http://') || str_starts_with($photoPath, 'https://')) {
            return $photoPath;
        }

        return Storage::disk('public')->url($photoPath);
    }

    public static function forProfile(?DoctorProfile $profile): ?string
    {
        return $profile ? self::url($profile->photo_path) : null;
    }
}
