import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import DoctorAvatar from '../../components/DoctorAvatar';
import './DoctorsPage.css';

const HERO_SLIDES = [
   { src: '/doctorpage1.jpeg', alt: 'Consultation médicale' },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (HERO_SLIDES.length <= 1) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const handleDot = (i) => {
    setCurrent(i);
    startTimer();
  };

  return (
    <div className="doctors-hero-slider" aria-label="Illustration">
      <div className="doctors-hero-slider-track">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`doctors-hero-slide${i === current ? ' doctors-hero-slide--active' : ''}`}
            aria-hidden={i !== current}
          >
            <img src={slide.src} alt={slide.alt} />
          </div>
        ))}
      </div>
      {HERO_SLIDES.length > 1 && (
        <div className="doctors-hero-dots" role="tablist">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              className={`doctors-hero-dot${i === current ? ' doctors-hero-dot--active' : ''}`}
              onClick={() => handleDot(i)}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StarRating({ rating }) {
  const rounded = Math.round(Number(rating) || 0);
  return (
    <div className="star-rating" aria-label={`${rounded} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? 'star filled' : 'star'}>★</span>
      ))}
    </div>
  );
}

function buildPageItems(current, last) {
  if (last <= 9) {
    return Array.from({ length: last }, (_, i) => ({ type: 'page', value: i + 1 }));
  }
  const values = new Set([1, last, current, current - 1, current + 1]);
  for (const p of [...values]) {
    if (p < 1 || p > last) values.delete(p);
  }
  const sorted = [...values].sort((a, b) => a - b);
  const items = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push({ type: 'gap', key: `g-${sorted[i]}` });
    }
    items.push({ type: 'page', value: sorted[i] });
  }
  return items;
}

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  const [filters, setFilters] = useState({
    specialty_id: '',
    price_max: 1000,
    sort: 'relevance',
  });
  const [searchParams] = useSearchParams();
  const urlSpecialtyId = searchParams.get('specialty_id') ?? '';

  useEffect(() => {
    if (urlSpecialtyId && filters.specialty_id !== urlSpecialtyId) {
      setFilters((prev) => ({
        ...prev,
        specialty_id: urlSpecialtyId,
      }));
      setPage(1);
    }
  }, [urlSpecialtyId, filters.specialty_id]);
  

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await api.get('/specialties');
        setSpecialties(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Erreur lors de la récupération des spécialités:', err);
        setSpecialties([]);
      }
    };

    fetchSpecialties();
  }, []);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      const specialtyId = urlSpecialtyId || filters.specialty_id;
      if (specialtyId) params.specialty_id = specialtyId;
      if (filters.price_max < 1000) params.price_max = filters.price_max;
      if (filters.sort) params.sort = filters.sort;

      const res = await api.get('/doctors', { params });
      const body = res.data;
      setDoctors(Array.isArray(body.data) ? body.data : []);
      setPagination({
        current_page: body.current_page ?? 1,
        last_page: body.last_page ?? 1,
        per_page: body.per_page ?? 12,
        total: body.total ?? 0,
      });
    } catch (err) {
      console.error('Erreur lors de la récupération des médecins:', err);
      setDoctors([]);
    }
    setLoading(false);
  }, [urlSpecialtyId, filters.specialty_id, filters.price_max, filters.sort, page]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(1);
  };

  const toggleSpecialty = (id) => {
    setFilters((prev) => ({
      ...prev,
      specialty_id: prev.specialty_id === id ? '' : id,
    }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ specialty_id: '', price_max: 1000, sort: 'relevance' });
    setPage(1);
  };

  const pageItems = buildPageItems(pagination.current_page, pagination.last_page);

  return (
    <div className="doctors-page">
      <header className="doctors-page-header">
        <div className="doctors-header-visual" aria-hidden="true">
          <HeroSlider />
        </div>
        <div className="doctors-header-content">
          <p className="doctors-overline">Annuaire médical</p>
          <h1 className="doctors-heading">Trouver un médecin</h1>
          <p className="doctors-lead">
            Parcourez nos professionnels de santé certifiés et prenez rendez-vous en quelques clics.
          </p>
        </div>
      </header>

      <div className="doctors-page-body">
        <div className="doctors-page-layout">
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h2>Filtres</h2>
              <p>Affinez votre recherche par spécialité et tarif.</p>
            </div>

            <div className="filter-section">
              <div className="filter-title">Spécialité</div>
              {specialties.map((spec) => (
                <div
                  key={spec.id}
                  className={`filter-option ${String(filters.specialty_id) === String(spec.id) ? 'active' : ''}`}
                  onClick={() => toggleSpecialty(String(spec.id))}
                  onKeyDown={(e) => e.key === 'Enter' && toggleSpecialty(String(spec.id))}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`checkbox ${String(filters.specialty_id) === String(spec.id) ? 'checked' : ''}`}>
                    {String(filters.specialty_id) === String(spec.id) && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  {spec.name}
                </div>
              ))}
            </div>

            <div className="filter-section">
              <div className="filter-title">Tarif (MAD)</div>
              <div className="price-range-wrap">
                <div className="price-labels">
                  <span>0 MAD</span>
                  <span>{filters.price_max === 1000 ? '1000+ MAD' : `${filters.price_max} MAD`}</span>
                </div>
                <input
                  type="range"
                  name="price_max"
                  min="0"
                  max="1000"
                  step="50"
                  value={filters.price_max}
                  onChange={handleChange}
                  className="range-input"
                />
              </div>
            </div>

            <button className="btn-reset" type="button" onClick={resetFilters}>
              Réinitialiser
            </button>
          </aside>

          <main className="doctors-main">
            <div className="doctors-topbar">
              <div className="doctors-meta">
                <strong>
                  {pagination.total} médecin{pagination.total !== 1 ? 's' : ''}
                </strong>{' '}
                trouvé{pagination.total !== 1 ? 's' : ''}
                {pagination.last_page > 1 && (
                  <span className="doctors-meta-muted">
                    {' '}· page {pagination.current_page}/{pagination.last_page}
                  </span>
                )}
              </div>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleChange}
                className="sort-select"
                aria-label="Trier les résultats"
              >
                <option value="relevance">Trier : Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="rating_desc">Mieux notés</option>
              </select>
            </div>

            {loading ? (
              <div className="doctors-loading">
                <div className="waiting-dots">
                  <div className="waiting-dot" />
                  <div className="waiting-dot" />
                  <div className="waiting-dot" />
                </div>
                <p>Recherche des meilleurs médecins...</p>
              </div>
            ) : (
              <>
                <div className="doctors-grid">
                  {doctors.map((doc) => {
                    const name = doc.name || doc.full_name || 'Médecin';
                    const specialty = doc.specialty?.name ?? doc.specialty_name ?? '';
                    const rating = doc.average_rating ?? doc.rating ?? 0;
                    const reviewCount = doc.reviews_count ?? doc.review_count ?? 0;

                    return (
                      <Link key={doc.id} to={`/doctor/${doc.id}`} className="doc-card-link">
                        <article className="doc-card">
                          <div className="doc-card-stripe" />
                          <div className="doc-card-head">
                            <DoctorAvatar doctor={doc} name={name} />
                          </div>
                          <div className="doc-card-body">
                            <p className="doc-name">{name}</p>
                            {specialty && <p className="doc-specialty">{specialty}</p>}
                            {rating > 0 && <StarRating rating={rating} />}
                            <div className="doc-meta">
                              {reviewCount > 0 && (
                                <span className="doc-chip">{reviewCount} avis</span>
                              )}
                              {doc.price != null && (
                                <span className="doc-chip doc-chip--price">{doc.price} MAD</span>
                              )}
                            </div>
                          </div>
                          <div className="doc-card-footer">
                            <span>Voir le profil</span>
                          </div>
                        </article>
                      </Link>
                    );
                  })}

                  {doctors.length === 0 && (
                    <div className="no-results-card">
                      <div className="no-results-icon" aria-hidden="true">🔍</div>
                      <h3>Aucun médecin trouvé</h3>
                      <p>Essayez de modifier vos filtres pour voir plus de résultats.</p>
                      <button className="btn-primary-teal" type="button" onClick={resetFilters}>
                        Réinitialiser les filtres
                      </button>
                    </div>
                  )}
                </div>

                {pagination.last_page > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      className="pag-btn"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label="Page précédente"
                    >
                      ←
                    </button>
                    {pageItems.map((item) =>
                      item.type === 'gap' ? (
                        <span key={item.key} className="pag-gap">…</span>
                      ) : (
                        <button
                          key={item.value}
                          type="button"
                          className={`pag-btn ${item.value === page ? 'active' : ''}`}
                          onClick={() => setPage(item.value)}
                        >
                          {item.value}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className="pag-btn pag-btn-large"
                      disabled={page >= pagination.last_page}
                      onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DoctorsPage;
