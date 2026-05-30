import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import PageHero from '../../components/PageHero';
import DoctorAvatar from '../../components/DoctorAvatar';
import { getDoctorPhotoUrl } from '../../utils/doctorPhoto';
import './Settings.css';

/** Laravel serializes `doctorProfile` as `doctor_profile` in JSON. */
function getDoctorProfile(user) {
  if (!user) return null;
  return user.doctor_profile ?? user.doctorProfile ?? null;
}

export default function Settings() {
  const { user, loading: authLoading, setUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', specialty_id: '', price: '' });
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setMessage('');

      try {
        const [meResponse, specialtiesResponse] = await Promise.all([
          api.get('/me'),
          user?.role === 'doctor' ? api.get('/specialties') : Promise.resolve({ data: [] }),
        ]);

        const profile = meResponse.data;
        console.debug('Loaded profile for settings page:', profile);

        if (!profile || !profile.id) {
          throw new Error('Aucun utilisateur trouvé pour la session en cours.');
        }

        const dp = getDoctorProfile(profile);
        setForm({
          name: profile.name || '',
          email: profile.email || '',
          specialty_id: dp?.specialty_id ?? dp?.specialty?.id ?? '',
          price: dp?.price ?? '',
        });

        if (profile.role === 'doctor') {
          setSpecialties(Array.isArray(specialtiesResponse.data) ? specialtiesResponse.data : []);
        }

        if (user?.role === 'doctor') {
          setPhotoUrl(getDoctorPhotoUrl(profile) || getDoctorPhotoUrl(dp) || '');
        }

        if (!user || profile.id !== user.id) {
          setUser(profile);
        }
      } catch (loadError) {
        console.error('Erreur de chargement du profil :', loadError);
        setError(loadError.response?.data?.message || loadError.message || 'Impossible de charger vos informations de profil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, authLoading, setUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || user?.role !== 'doctor') return;

    setPhotoUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await api.post('/doctor/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrl(response.data.photo_url);
      setMessage('Photo de profil mise à jour.');
      const me = await api.get('/me');
      setUser(me.data);
    } catch (uploadError) {
      setError(
        uploadError.response?.data?.message || 'Impossible de téléverser la photo.'
      );
    } finally {
      setPhotoUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        name: form.name,
        email: form.email,
      };

      if (user?.role === 'doctor') {
        const sid = form.specialty_id;
        payload.specialty_id =
          sid !== '' && sid != null ? Number(sid) : null;
        payload.price =
          form.price === '' || form.price == null ? null : Number(form.price);
      }

      const response = await api.put('/user/profile', payload);
      const updatedUser = response.data.user || response.data;
      setUser(updatedUser);
      setMessage('Profil mis à jour avec succès.');
    } catch (submitError) {
      console.error('Erreur de mise à jour du profil :', submitError);
      const serverMessage = submitError.response?.data?.message || submitError.message;
      setError(serverMessage || 'Impossible de mettre à jour votre profil.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="app-page">
        <h2>Vérification de votre session en cours...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-page">
        <h2>Veuillez vous connecter pour modifier votre profil.</h2>
      </div>
    );
  }

  return (
    <div className="app-page">
      <PageHero
        image="/people.png"
        overline="Compte"
        title={<>Parametres du <span>profil</span></>}
        lead="Modifiez votre nom, votre e-mail et votre specialite si vous etes medecin."
      />
      <div className="app-page-body settings-container">

        <form className="settings-form" onSubmit={handleSubmit}>
          {message && <div className="settings-message success">{message}</div>}
          {error && <div className="settings-message error">{error}</div>}

          {loading ? (
            <div className="settings-loading">Chargement des données...</div>
          ) : (
            <>
              {user?.role === 'doctor' && (
                <div className="settings-photo-block">
                  <label>Photo de profil</label>
                  <div className="settings-photo-row">
                    <DoctorAvatar
                      doctor={{ name: form.name, photo_url: photoUrl }}
                      size="lg"
                    />
                    <div>
                      <p className="settings-photo-hint">
                        Visible sur votre fiche et pour tous les patients.
                      </p>
                      <label className="btn btn-outline settings-photo-btn">
                        {photoUploading ? 'Envoi…' : 'Choisir une photo'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhotoChange}
                          disabled={photoUploading}
                          hidden
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <label htmlFor="name">Nom</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>

              <div className="form-row">
                <label htmlFor="email">Adresse e-mail</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>

              {user?.role === 'doctor' && (
                <>
                  <div className="form-row">
                    <label htmlFor="specialty_id">Spécialité</label>
                    <select id="specialty_id" name="specialty_id" value={form.specialty_id} onChange={handleChange} required>
                      <option value="">Sélectionnez une spécialité</option>
                      {specialties.map((specialty) => (
                        <option key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label htmlFor="price">Prix consultation vidéo (€)</label>
                    <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
