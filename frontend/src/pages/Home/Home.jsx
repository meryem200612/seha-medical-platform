import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import DoctorAvatar from '../../components/DoctorAvatar';
import './Home.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y } from 'swiper/modules';
import 'swiper/css';

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
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

function DoctorCardSkeleton() {
  return (
    <div className="doc-card doc-card--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--avatar" />
      <div className="doc-info">
        <div className="skeleton skeleton--line" style={{ width: '60%' }} />
        <div className="skeleton skeleton--line" style={{ width: '40%', marginTop: 6 }} />
        <div className="skeleton skeleton--line" style={{ width: '80%', marginTop: 10 }} />
        <div className="skeleton skeleton--line" style={{ width: '50%', marginTop: 4 }} />
      </div>
    </div>
  );
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

const IllustrationVideoCall = () => <img src="consultationvd.png" alt="Téléconsultation" className="feat-illustration" />;
const IllustrationBooking   = () => <img src="calendar.png"       alt="Rendez-vous"      className="feat-illustration" />;
const IllustrationProgram   = () => <img src="programme.png"      alt="Suivi"            className="feat-illustration" />;
const IllustrationChat      = () => <img src="chat.png"           alt="Messagerie"       className="feat-illustration" />;

function FeatureRow({ illustration: Illustration, eyebrow, title, description, bullets, reverse, gradient }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`feat-row${reverse ? ' feat-row--reverse' : ''}${visible ? ' feat-row--visible' : ''}`}
      style={{ '--feat-gradient': gradient }}
    >
      <div className="feat-visual">
        <div className="feat-glow-ring" />
        <Illustration />
      </div>
      <div className="feat-content">
        <span className="feat-eyebrow">{eyebrow}</span>
        <h3 className="feat-title">{title}</h3>
        <p className="feat-description">{description}</p>
        <ul className="feat-bullets">
          {bullets.map((b, i) => (
            <li key={i} className="feat-bullet"><span className="feat-bullet-dot" />{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Hero Slider
───────────────────────────────────────────── */
const HERO_SLIDES = [
  // { src: 'hero1.jpeg',    alt: 'Consultation médicale' },
  // { src: 'hero2.jpeg', alt: 'Téléconsultation vidéo' },
  // { src: 'hero3.jpeg',       alt: 'Prise de rendez-vous'  },
  // { src: 'hero4.jpeg',      alt: 'Suivi personnalisé'    },
   { src: 'hero5.jpeg',      alt: 'Suivi personnalisé'    },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % HERO_SLIDES.length);
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
    <div className="hero-slider" aria-label="Galerie">
      <div className="hero-slider-track">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`hero-slide${i === current ? ' hero-slide--active' : ''}`}
            aria-hidden={i !== current}
          >
            <img src={slide.src} alt={slide.alt} />
          </div>
        ))}
      </div>
      <div className="hero-slider-dots" role="tablist">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            className={`hero-dot${i === current ? ' hero-dot--active' : ''}`}
            onClick={() => handleDot(i)}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */
const FEATURES = [
  { illustration: IllustrationVideoCall, eyebrow: 'Téléconsultation',   title: 'Votre médecin, où que vous soyez',        description: "Consultez un professionnel de santé par vidéo depuis chez vous. Chiffré de bout en bout, conforme aux normes médicales marocaines.",                                                             bullets: ['Appels HD sécurisés', 'Audio + vidéo + chat', 'Disponible 7j/7'],         gradient: 'linear-gradient(135deg,#e0f7f6,#f0fafa)', reverse: false },
  { illustration: IllustrationBooking,   eyebrow: 'Rendez-vous',        title: 'Réservez en quelques secondes',            description: "Choisissez votre médecin, consultez ses disponibilités en temps réel et confirmez votre rendez-vous instantanément — sans appel téléphonique.",                                              bullets: ['Agenda en temps réel', 'Rappels automatiques', 'Annulation flexible'],    gradient: 'linear-gradient(135deg,#eff6ff,#f8faff)', reverse: true  },
  { illustration: IllustrationProgram,   eyebrow: 'Suivi personnalisé', title: "Un programme de santé sur mesure",         description: "Votre médecin conçoit un programme adapté à votre profil — nutrition, activité, médication — avec un suivi hebdomadaire et des rappels intelligents.",                                      bullets: ['Objectifs hebdomadaires', 'Rappels médicaments', 'Bilan de progression'], gradient: 'linear-gradient(135deg,#fffbeb,#fefcf3)', reverse: false },
  { illustration: IllustrationChat,      eyebrow: 'Messagerie sécurisée', title: "Restez en contact avec votre médecin", description: "Posez vos questions, partagez des résultats d'analyse ou des ordonnances directement par message sécurisé. Votre médecin répond dès que possible.",                                   bullets: ['Partage de documents', 'Historique complet', 'Notifications push'],       gradient: 'linear-gradient(135deg,#f0fdf4,#f8fff9)', reverse: true  },
];

const SPECIALTY_CONFIG = [
  { apiName: 'Dentiste',      label: 'Dentiste',     img: '/dentist.png' },
  { apiName: 'Ophtalmologue', label: 'Ophtalmo',     img: '/ophthalmologist.png' },
  { apiName: 'Cardiologue',   label: 'Cardiologue',  img: '/cardiologist.png' },
  { apiName: 'Pédiatrie',     label: 'Pédiatre',     img: '/pediatrician.png' },
  { apiName: 'Neurologie',    label: 'Neurologue',   img: '/neurologist (1).png' },
  { apiName: 'Orthopédiste',  label: 'Orthopédiste', img: '/orthopedist.png' },
];

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [searchParams,   setSearchParams]   = useState({ specialty_id: '' });
  const [specialties,    setSpecialties]    = useState([]);
  const [popularDoctors, setPopularDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError,   setDoctorsError]   = useState(false);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await api.get('/specialties');
        setSpecialties(Array.isArray(res.data) ? res.data : []);
      } catch { setSpecialties([]); }
    };
    const fetchPopularDoctors = async () => {
      setDoctorsLoading(true);
      try {
        const res  = await api.get('/doctors', { params: { sort: 'rating', limit: 8 } });
        const raw  = res.data;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        setPopularDoctors(list.slice(0, 8));
      } catch { setDoctorsError(true); setPopularDoctors([]); }
      finally  { setDoctorsLoading(false); }
    };
    fetchSpecialties();
    fetchPopularDoctors();
  }, []);

  const getDoctorLink = (apiName) => {
    const found = specialties.find((s) => s.name === apiName);
    return found?.id ? `/doctors?specialty_id=${found.id}` : '/doctors';
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchParams.specialty_id) params.append('specialty_id', searchParams.specialty_id);
    navigate(params.toString() ? `/doctors?${params}` : '/doctors');
  };

  const normaliseDoctor = (doc) => ({
    id:          doc.id,
    fullName:    doc.full_name || doc.name || `${doc.first_name ?? ''} ${doc.last_name ?? ''}`.trim(),
    specialty:   doc.specialty?.name || doc.specialty_name || doc.specialty || '',
    city:        doc.city || doc.location || '',
    rating:      doc.average_rating ?? doc.rating ?? 0,
    reviewCount: doc.reviews_count ?? doc.review_count ?? doc.reviews ?? 0,
    isVerified:  doc.is_verified ?? doc.verified ?? false,
    photo_url:   doc.photo_url,
  });

  return (
    <div className="app-page">

      {/* ══ HERO ══ */}
      <div className="hero">
        <div className="hero-illustration">
          <HeroSlider />
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1>Votre santé,<br /><span>Notre priorité.</span></h1>
            <p>
              Trouvez les meilleurs professionnels de santé au Maroc.<br />
              Réservation de rendez-vous rapide, en toute sécurité.
            </p>
            <div className="search-bar">
              <select
                className="search-input"
                value={searchParams.specialty_id}
                onChange={(e) => setSearchParams({ specialty_id: e.target.value })}
              >
                <option value="">Toutes les spécialités</option>
                {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button className="search-btn" onClick={handleSearch}>Rechercher</button>
            </div>
            <div className="stats-row">
              <div className="stat-item"><div className="stat-num">5k+</div><div className="stat-label">Médecins certifiés</div></div>
              <div className="stat-item"><div className="stat-num">1M+</div><div className="stat-label">Patients satisfaits</div></div>
              <div className="stat-item"><div className="stat-num">4.9/5</div><div className="stat-label">Avis positifs</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SERVICES SHOWCASE ══ */}
      <section className="services-showcase" aria-labelledby="services-heading">
        <div className="services-intro">
          <p className="services-overline">Une plateforme complète</p>
          <h2 id="services-heading" className="services-heading">
            Tout ce dont vous avez<br />besoin pour votre santé
          </h2>
          <p className="services-lead">
            De la consultation vidéo au suivi personnalisé, Sena réunit tous les outils de santé modernes dans une expérience fluide et sécurisée.
          </p>
        </div>
        <div className="feat-stack">
          {FEATURES.map((feat) => <FeatureRow key={feat.eyebrow} {...feat} />)}
        </div>
      </section>

      {/* ══ SPECIALTIES ══ */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Spécialités principales</div>
          <Link to="/doctors" className="see-all">Voir tout</Link>
        </div>
        <div className="categories-grid">
          {SPECIALTY_CONFIG.map((spec) => (
            <Link key={spec.apiName} to={getDoctorLink(spec.apiName)} style={{ textDecoration: 'none' }}>
              <div className="cat-card">
                <div className="cat-img-placeholder">
                  <img src={spec.img} alt={spec.label} className="cat-img" />
                </div>
                <div className="cat-name">{spec.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ══ POPULAR DOCTORS ══ */}
      <div className="doctors-section">
        <div className="section-header">
          <div className="section-title">Médecins populaires</div>
          <Link to="/doctors" className="see-all">Voir tout</Link>
        </div>

        {doctorsLoading && (
          <div className="doctors-grid">
            {[1, 2, 3].map((i) => <DoctorCardSkeleton key={i} />)}
          </div>
        )}

        {!doctorsLoading && doctorsError && (
          <p className="doctors-feedback doctors-feedback--error">
            Impossible de charger les médecins. Veuillez réessayer plus tard.
          </p>
        )}

        {!doctorsLoading && !doctorsError && popularDoctors.length === 0 && (
          <p className="doctors-feedback">Aucun médecin disponible pour le moment.</p>
        )}

        {!doctorsLoading && !doctorsError && popularDoctors.length > 0 && (
        
          <div className="carousel-shell">

            <button className="carousel-nav-btn doc-swiper-prev" aria-label="Précédent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="carousel-track">
              <Swiper
                modules={[Navigation, A11y]}
                navigation={{
                  prevEl: '.doc-swiper-prev',
                  nextEl: '.doc-swiper-next',
                  disabledClass: 'carousel-nav-btn--disabled',
                }}
                slidesPerView={1}
                spaceBetween={14}
                grabCursor={true}
                breakpoints={{
                  600: { slidesPerView: 2, spaceBetween: 14 },
                  900: { slidesPerView: 3, spaceBetween: 16 },
                }}
                className="doctors-swiper"
              >
                {popularDoctors.map((raw) => {
                  const doc = normaliseDoctor(raw);
                  return (
                    <SwiperSlide key={doc.id}>
                      <Link  key={doc.id} to={`/doctor/${doc.id}`} className="doc-card-link">
                        <article className="doc-card doc-card--carousel">

                          {/* Teal accent stripe */}
                          <div className="doc-card-stripe" />

                          {/* Avatar row */}
                          <div className="doc-card-head">
                            <DoctorAvatar doctor={doc} name={doc.fullName} />
                            {doc.isVerified && (
                              <span className="doc-badge">
                                <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                </svg>
                                Vérifié
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="doc-card-body">
                            <p className="doc-name">{doc.fullName}</p>
                            {doc.specialty && <p className="doc-specialty">{doc.specialty}</p>}
                            <StarRating rating={doc.rating} />
                            <div className="doc-meta">
                              {doc.reviewCount > 0 && (
                                <span className="doc-chip doc-chip--reviews">{doc.reviewCount} avis</span>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="doc-card-footer">
                            <span>Voir le profil</span>
                           
                          </div>

                        </article>
                      </Link>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            <button className="carousel-nav-btn doc-swiper-next" aria-label="Suivant">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

          </div>
        )}
       
      </div>
      

    </div>
  );
}