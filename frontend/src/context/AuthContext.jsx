import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

function normalizeUser(user) {
    if (!user || typeof user !== 'object') return user;

    const patientProfile = user.patient_profile ?? user.patientProfile ?? null;
    const doctorProfile = user.doctor_profile ?? user.doctorProfile ?? null;

    return {
        ...user,
        patient_profile: patientProfile,
        patientProfile,
        doctor_profile: doctorProfile,
        doctorProfile,
        profile: patientProfile ?? doctorProfile ?? null,
    };
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const setAuthUser = (nextUser) => {
        setUser(normalizeUser(nextUser));
    };

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const response = await api.get('/me');
                    setAuthUser(response.data);
                } catch (error) {
                    localStorage.removeItem('auth_token');
                    setAuthUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/login', { email, password });
        const { access_token, user } = response.data;
        localStorage.setItem('auth_token', access_token);
        setAuthUser(user);
        return user;
    };

    const register = async (userData) => {
        const response = await api.post('/register', userData);
        const { access_token, user } = response.data;
        localStorage.setItem('auth_token', access_token);
        setAuthUser(user);
        return user;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            localStorage.removeItem('auth_token');
            setAuthUser(null);
        }
    };

    /**
     * Upload a new profile photo for the logged-in user (doctor or patient).
     * Updates the user state immediately after success so the UI reflects it.
     * @param {File} file - The image file selected by the user
     * @returns {string} The new photo_url returned by the server
     */
    const updateProfilePhoto = async (file) => {
        const formData = new FormData();
        formData.append('photo', file);

        const endpoint =
            user?.role === 'doctor'
                ? '/doctor/profile/photo'
                : '/patient/profile/photo';

        const response = await api.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        const { photo_url, photo_path } = response.data;

        // Immediately update the user object in context so all components re-render
        setAuthUser({
            ...user,
            // Update doctor profile photo
            doctorProfile: user.doctorProfile
                ? { ...user.doctorProfile, photo_url, photo_path }
                : user.doctorProfile,
            doctor_profile: user.doctor_profile
                ? { ...user.doctor_profile, photo_url, photo_path }
                : user.doctor_profile,
            // Update patient profile photo
            patientProfile: user.patientProfile
                ? { ...user.patientProfile, photo_url, photo_path }
                : user.patientProfile,
            patient_profile: user.patient_profile
                ? { ...user.patient_profile, photo_url, photo_path }
                : user.patient_profile,
        });

        return photo_url;
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout, setUser: setAuthUser, updateProfilePhoto }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);