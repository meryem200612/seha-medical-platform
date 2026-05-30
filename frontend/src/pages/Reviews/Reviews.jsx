import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import PageHero from '../../components/PageHero';
import './Reviews.css';

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get('/doctor/reviews');
        setReviews(response.data);
      } catch (error) {
        console.error('Error fetching doctor reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'doctor') {
      fetchReviews();
    }
  }, [user]);

  if (!user || user.role !== 'doctor') {
    return (
      <div className="app-page">
        <h2>Accès restreint</h2>
        <p>Cette page est réservée aux médecins.</p>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="app-page">
      <PageHero
        image="/hero5.jpeg"
        overline="Reputation"
        title={<>Avis <span>recus</span></>}
        lead="Retours d'experience de vos patients."
      />
      <div className="app-page-body reviews-layout">
        <div className="reviews-header">
          <div />
          <div className="rating-summary">
            <div className="summary-val">{averageRating}<span>★</span></div>
            <div className="summary-label">Note moyenne ({reviews.length} avis)</div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Chargement des avis...</div>
        ) : reviews.length === 0 ? (
          <div className="empty-reviews">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
            <h3>Aucun avis pour le moment</h3>
            <p>Les avis de vos patients apparaîtront ici après leurs consultations.</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-card-header">
                  <div className="patient-info">
                    <div className="patient-avatar-mini">
                      {review.patient_name ? review.patient_name.charAt(0) : 'P'}
                    </div>
                    <div>
                      <div className="patient-name">{review.patient_name}</div>
                      <div className="review-date">{new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div className="review-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < review.rating ? '#F59E0B' : 'var(--gray-3)' }}>★</span>
                    ))}
                  </div>
                </div>
                <div className="review-content">
                  {review.comment || <span style={{ fontStyle: 'italic', color: 'var(--text-3)' }}>Aucun commentaire laissé.</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}