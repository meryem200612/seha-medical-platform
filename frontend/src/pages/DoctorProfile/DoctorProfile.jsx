import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import DoctorAvatar from '../../components/DoctorAvatar';
import './DoctorProfile.css';

function getInitials(name) {
  return (name || 'DR')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function StarRating({ rating, size = 'md' }) {
  const rounded = Math.round(Number(rating) || 0);
  return (
    <div className={`doc-star-rating doc-star-rating--${size}`} aria-label={`${rounded} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? 'star filled' : 'star'}>
          ★
        </span>
      ))}
    </div>
  );
}

function formatReviewDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function DoctorProfile() {
  const { user } = useAuth();
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    let isActive = true;

    const fetchDoctor = async () => {
      setLoading(true);
      setDoctor(null);
      try {
        const response = await api.get(`/doctors/${id}`);
        if (isActive) setDoctor(response.data);
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
        if (isActive) setDoctor(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchDoctor();
    return () => { isActive = false; };
  }, [id]);

  const fetchDoctorDetails = async () => {
    const response = await api.get(`/doctors/${id}`);
    setDoctor(response.data);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value,
    }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      await api.post(`/doctors/${id}/reviews`, {
        rating: form.rating,
        comment: form.comment || null,
      });
      await fetchDoctorDetails();
      setForm({ rating: 5, comment: '' });
      setSubmitSuccess('Merci ! Votre avis a été publié.');
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Impossible de publier votre avis.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-profile-page">
        <div className="doctor-profile-loading">Chargement du profil…</div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="doctor-profile-page">
        <div className="doctor-profile-gate">
          <p>Médecin introuvable.</p>
          <Link to="/doctors" className="doc-profile-btn doc-profile-btn--primary">
            Retour aux médecins
          </Link>
        </div>
      </div>
    );
  }

  const doctorName = doctor.user?.name || doctor.name || 'Médecin';
  const specialty = doctor.specialty?.name ?? 'Médecin';
  const fee = doctor.consultation_fee ?? doctor.price ?? 300;
  const rating = doctor.average_rating ?? doctor.rating ?? 0;
  const reviewCount = doctor.reviews_count ?? doctor.review_count ?? (doctor.reviews?.length ?? 0);
  const reviews = Array.isArray(doctor.reviews) ? doctor.reviews : [];
  const initials = getInitials(doctorName);

  return (
    <div className="doctor-profile-page">
      <header className="doctor-profile-header">
        <div className="doctor-header-visual" aria-hidden="true">
          <img src="/hero5.jpeg" alt="" />
        </div>
        <div className="doctor-header-content">
          <DoctorAvatar doctor={doctor} name={doctorName} size="xl" className="doctor-header-avatar" />
          <div className="doctor-header-text">
            <p className="doctor-overline">{specialty}</p>
            <h1 className="doctor-heading">Dr. {doctorName}</h1>
            <div className="doctor-header-rating">
              <StarRating rating={rating} size="lg" />
              <span className="doctor-rating-text">
                {Number(rating).toFixed(1)} · {reviewCount} avis
              </span>
            </div>
          </div>
          <div className="doctor-header-actions">
            {user?.role === 'patient' && (
              <Link to={`/booking/${doctor.id}`} className="doc-profile-btn doc-profile-btn--primary">
                Prendre rendez-vous
              </Link>
            )}
            <Link to={`/messages?doctor_id=${doctor.id}`} className="doc-profile-btn doc-profile-btn--outline">
              Envoyer un message
            </Link>
          </div>
        </div>
      </header>

      <div className="doctor-profile-body">
        <div className="doctor-profile-layout">
          <main className="doctor-profile-main">
            <section className="doctor-section-card">
              <h2 className="doctor-section-title">À propos</h2>
              <p className="doctor-about-text">
                {doctor.bio ||
                  doctor.description ||
                  `Dr. ${doctorName} est spécialiste en ${specialty}. Consultations en vidéo ou en cabinet selon vos besoins.`}
              </p>
              <div className="doctor-meta-grid">
                <div className="doctor-meta-item">
                  <span className="doctor-meta-icon">🩺</span>
                  <div>
                    <span className="doctor-meta-label">Spécialité</span>
                    <span className="doctor-meta-value">{specialty}</span>
                  </div>
                </div>
                <div className="doctor-meta-item">
                  <span className="doctor-meta-icon">💰</span>
                  <div>
                    <span className="doctor-meta-label">Consultation</span>
                    <span className="doctor-meta-value">{fee} MAD · 30 min</span>
                  </div>
                </div>
                <div className="doctor-meta-item">
                  <span className="doctor-meta-icon">⭐</span>
                  <div>
                    <span className="doctor-meta-label">Note moyenne</span>
                    <span className="doctor-meta-value">{Number(rating).toFixed(1)} / 5</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="doctor-section-card">
              <div className="doctor-section-head">
                <h2 className="doctor-section-title">Avis patients</h2>
                <span className="doctor-review-count">{reviewCount} avis</span>
              </div>
              {reviews.length > 0 ? (
                <div className="doctor-reviews-list">
                  {reviews.map((review) => (
                    <article key={review.id} className="doctor-review-card">
                      <div className="doctor-review-top">
                        <div className="doctor-review-avatar">
                          {(review.patient_name || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div className="doctor-review-meta">
                          <span className="doctor-review-name">
                            {review.patient_name || 'Patient'}
                          </span>
                          <span className="doctor-review-date">
                            {formatReviewDate(review.created_at)}
                          </span>
                        </div>
                        <div className="doctor-review-stars">
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                      </div>
                      <p className="doctor-review-comment">
                        {review.comment || 'Aucun commentaire.'}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="doctor-empty">Aucun avis pour le moment.</p>
              )}
            </section>

            {user?.role === 'patient' && (
              <section className="doctor-section-card doctor-review-form-card">
                <h2 className="doctor-section-title">Laisser un avis</h2>
                <form onSubmit={handleReviewSubmit} className="doctor-review-form">
                  <div className="doctor-form-group">
                    <label htmlFor="rating">Note</label>
                    <select
                      id="rating"
                      name="rating"
                      value={form.rating}
                      onChange={handleFormChange}
                      required
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} étoile{n > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="doctor-form-group">
                    <label htmlFor="comment">Commentaire</label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={form.comment}
                      onChange={handleFormChange}
                      rows={4}
                      placeholder="Partagez votre expérience…"
                    />
                  </div>
                  {submitError ? <p className="doctor-form-error">{submitError}</p> : null}
                  {submitSuccess ? <p className="doctor-form-success">{submitSuccess}</p> : null}
                  <button
                    type="submit"
                    className="doc-profile-btn doc-profile-btn--primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Publication…' : 'Publier mon avis'}
                  </button>
                </form>
              </section>
            )}
          </main>

          <aside className="doctor-profile-sidebar">
            <div className="doctor-booking-card">
              <p className="doctor-booking-overline">Réservation</p>
              <div className="doctor-booking-price">
                {fee} <span>MAD</span>
              </div>
              <p className="doctor-booking-note">Consultation · 30 minutes</p>
              <ul className="doctor-booking-features">
                <li>Annulation gratuite 24h avant</li>
                <li>Confirmation immédiate</li>
                <li>Paiement sécurisé</li>
              </ul>
              {user?.role === 'patient' ? (
                <Link
                  to={`/booking/${doctor.id}`}
                  className="doc-profile-btn doc-profile-btn--primary doc-profile-btn--block"
                >
                  Réserver un créneau
                </Link>
              ) : (
                <p className="doctor-booking-login">
                  <Link to="/auth">Connectez-vous</Link> pour prendre rendez-vous.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
