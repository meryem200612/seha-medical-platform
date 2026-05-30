import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DoctorAvatar from './DoctorAvatar';

/**
 * ProfilePhotoUpload
 * Drop-in component: shows the current avatar with a camera overlay.
 * Clicking it opens a file picker and uploads immediately.
 *
 * Usage:
 *   <ProfilePhotoUpload />
 */
export default function ProfilePhotoUpload({ size = 'lg', className = '' }) {
    const { user, updateProfilePhoto } = useAuth();
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleClick = () => {
        if (!uploading) inputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset so the same file can be re-selected if needed
        e.target.value = '';

        setError(null);
        setUploading(true);
        try {
            await updateProfilePhoto(file);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Erreur lors du téléchargement.';
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    // Build the doctor-like object so DoctorAvatar can resolve the photo
    const avatarDoctor =
        user?.role === 'doctor'
            ? user
            : {
                  name: user?.name,
                  photo_url:
                      user?.patientProfile?.photo_url ||
                      (user?.patientProfile?.photo_path
                          ? `http://localhost:8000/storage/${user.patientProfile.photo_path}`
                          : null),
              };

    return (
        <div className={`profile-photo-upload ${className}`.trim()}>
            <button
                type="button"
                className={`profile-photo-upload__btn ${uploading ? 'profile-photo-upload__btn--loading' : ''}`}
                onClick={handleClick}
                aria-label="Changer la photo de profil"
                disabled={uploading}
            >
                <DoctorAvatar doctor={avatarDoctor} name={user?.name} size={size} />

                <span className="profile-photo-upload__overlay">
                    {uploading ? (
                        <span className="profile-photo-upload__spinner" />
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    )}
                </span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {error && (
                <p className="profile-photo-upload__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}