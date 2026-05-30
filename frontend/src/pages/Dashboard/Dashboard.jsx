import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DoctorAvatar from '../../components/DoctorAvatar';
import { getDoctorPhotoUrl } from '../../utils/doctorPhoto';
import './Dashboard.css';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Tableau de bord', icon: '◉', exact: true },
  { path: '/patients', label: 'Mes patients', icon: '◎' },
  { path: '/messages', label: 'Messages', icon: '✉' },
  { path: '/programs', label: 'Programmes', icon: '◈' },
  { path: '/revenus', label: 'Revenus', icon: '◇' },
  { path: '/reviews', label: 'Avis', icon: '★' },
  { path: '/agenda', label: 'Agenda', icon: '▦' },
  { path: '/settings', label: 'Paramètres', icon: '⚙' },
];

const QUICK_ACTIONS = [
  { to: '/video', label: 'Salle vidéo', desc: 'Consultations en direct', icon: '▶', primary: true, state: { patientId: null } },
  { to: '/agenda', label: 'Agenda', desc: 'Vos créneaux', icon: '▦' },
  { to: '/messages', label: 'Messages', desc: 'Échanges patients', icon: '✉' },
  { to: '/programs', label: 'Programmes', desc: 'Plans de soins', icon: '◈' },
];

function getInitials(name) {
  return (name || '??')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function statusLabel(status) {
  const map = {
    confirmed: 'Confirmé',
    pending: 'En attente',
    cancelled: 'Annulé',
    canceled: 'Annulé',
  };
  return map[status] || status;
}

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({
    appointments_this_month: 0,
    revenue_this_month: 0,
    average_rating: 0,
    upcoming_today: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      try {
        const response = await api.get('/doctor/dashboard');
        setStats(response.data.stats || {});
        setUpcomingAppointments(response.data.upcoming_appointments || []);
        setRecentReviews(response.data.recent_reviews || []);
      } catch (error) {
        console.error('Error fetching doctor dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (!user) {
    return (
      <div className="dash-page">
        <div className="dash-gate">Veuillez vous connecter pour voir votre tableau de bord.</div>
      </div>
    );
  }

  const specialty =
    user.doctor_profile?.specialty?.name ??
    user.doctorProfile?.specialty?.name ??
    'Médecin';
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const doctorForAvatar = {
    name: user.name,
    photo_url: getDoctorPhotoUrl(user),
  };

  return (
    <div className="dash-page">
      <div className="dash-bg-decor" aria-hidden="true">
        <span className="dash-blob dash-blob--1" />
        <span className="dash-blob dash-blob--2" />
      </div>

      <div className="dash-layout">
        <aside className="dash-sidebar">
          <div className="dash-sidebar-top">
            <Link to="/" className="dash-brand">
              <span className="dash-brand-mark">+</span>
              <span className="dash-brand-text">Seha</span>
            </Link>
            <p className="dash-sidebar-label">Espace praticien</p>
          </div>

          <nav className="dash-nav">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`dash-nav-item${isActive(item.path, item.exact) ? ' is-active' : ''}`}
              >
                <span className="dash-nav-icon">{item.icon}</span>
                <span className="dash-nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="dash-sidebar-foot">
            <div className="dash-user-card">
              <DoctorAvatar doctor={doctorForAvatar} name={user.name} size="md" />
              <div className="dash-user-meta">
                <span className="dash-user-name">Dr. {user.name}</span>
                <span className="dash-user-role">{specialty}</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="dash-main">
          <header className="dash-hero">
            <div className="dash-hero-text">
              <p className="dash-hero-overline">{getGreeting()}</p>
              <h1 className="dash-hero-title">
                Dr. {user.name.split(' ').slice(-1)[0] || user.name}
              </h1>
              <p className="dash-hero-date">{today}</p>
              <p className="dash-hero-tagline">
                Voici un aperçu de votre activité et de vos prochains rendez-vous.
              </p>
            </div>
            <div className="dash-hero-badge">
              <span className="dash-hero-badge-num">{stats.upcoming_today ?? 0}</span>
              <span className="dash-hero-badge-lbl">RDV aujourd&apos;hui</span>
            </div>
          </header>

          <section className="dash-quick">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                state={action.state}
                className={`dash-quick-card${action.primary ? ' dash-quick-card--primary' : ''}`}
              >
                <span className="dash-quick-icon">{action.icon}</span>
                <span className="dash-quick-label">{action.label}</span>
                <span className="dash-quick-desc">{action.desc}</span>
              </Link>
            ))}
          </section>

          <section className="dash-metrics">
            <article className="dash-metric dash-metric--teal">
              <div className="dash-metric-head">
                <span className="dash-metric-icon-wrap">📋</span>
                <span className="dash-metric-tag">Ce mois</span>
              </div>
              <p className="dash-metric-value">{stats.appointments_this_month ?? 0}</p>
              <p className="dash-metric-label">Consultations</p>
            </article>
            <article className="dash-metric dash-metric--mint">
              <div className="dash-metric-head">
                <span className="dash-metric-icon-wrap">💰</span>
                <span className="dash-metric-tag">Ce mois</span>
              </div>
              <p className="dash-metric-value">
                {stats.revenue_this_month ? `${stats.revenue_this_month}` : '0'}
                <small> MAD</small>
              </p>
              <p className="dash-metric-label">Revenus estimés</p>
            </article>
            <article className="dash-metric dash-metric--gold">
              <div className="dash-metric-head">
                <span className="dash-metric-icon-wrap">★</span>
                <span className="dash-metric-tag">Patients</span>
              </div>
              <p className="dash-metric-value">{stats.average_rating?.toFixed(1) ?? '0.0'}</p>
              <p className="dash-metric-label">Note moyenne</p>
            </article>
            <article className="dash-metric dash-metric--accent">
              <div className="dash-metric-head">
                <span className="dash-metric-icon-wrap">◷</span>
                <span className="dash-metric-tag">Live</span>
              </div>
              <p className="dash-metric-value">{stats.upcoming_today ?? 0}</p>
              <p className="dash-metric-label">Aujourd&apos;hui</p>
            </article>
          </section>

          <div className="dash-grid">
            <section className="dash-panel dash-panel--wide">
              <div className="dash-panel-head">
                <div>
                  <h2 className="dash-panel-title">Prochains rendez-vous</h2>
                  <p className="dash-panel-sub">Votre file d&apos;attente du jour</p>
                </div>
                <Link to="/agenda" className="dash-panel-link">
                  Voir l&apos;agenda →
                </Link>
              </div>

              {loading ? (
                <div className="dash-skeleton">Chargement des rendez-vous…</div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="dash-empty">
                  <span className="dash-empty-icon">📅</span>
                  <p>Aucun rendez-vous à venir pour le moment.</p>
                  <Link to="/agenda" className="btn btn-outline btn-sm">
                    Gérer mon agenda
                  </Link>
                </div>
              ) : (
                <ul className="dash-appointments">
                  {upcomingAppointments.map((apt, index) => (
                    <li key={apt.id} className="dash-apt-card">
                      <div className="dash-apt-time">
                        <span className="dash-apt-slot">{apt.time_slot}</span>
                        <span className="dash-apt-line" />
                      </div>
                      <div className="dash-apt-body">
                        <div className="dash-apt-avatar">
                          {getInitials(apt.patient_name)}
                        </div>
                        <div className="dash-apt-info">
                          <span className="dash-apt-name">
                            {apt.patient_name || 'Patient'}
                          </span>
                          <span className="dash-apt-meta">
                            {apt.date} · {apt.type === 'video' ? 'Vidéo' : 'Cabinet'}
                          </span>
                        </div>
                        <span className={`dash-status dash-status--${apt.status}`}>
                          {statusLabel(apt.status)}
                        </span>
                      </div>
                      {index === 0 && apt.type === 'video' && (
                        <Link
                          to="/video"
                          state={{ patientId: apt.patient_id }}
                          className="dash-apt-video"
                        >
                          Rejoindre
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dash-panel dash-panel--reviews">
              <div className="dash-panel-head">
                <div>
                  <h2 className="dash-panel-title">Avis récents</h2>
                  <p className="dash-panel-sub">Confiance & réputation</p>
                </div>
                <Link to="/reviews" className="dash-panel-link">
                  Tous →
                </Link>
              </div>

              {loading ? (
                <p className="dash-skeleton">Chargement…</p>
              ) : recentReviews.length === 0 ? (
                <div className="dash-empty dash-empty--compact">
                  <p>Pas encore d&apos;avis.</p>
                </div>
              ) : (
                <ul className="dash-reviews">
                  {recentReviews.map((review) => (
                    <li key={review.id} className="dash-review">
                      <div className="dash-review-stars" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span
                            key={i}
                            className={i <= review.rating ? 'filled' : ''}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="dash-review-author">
                        {review.patient_name || 'Patient'}
                      </p>
                      <p className="dash-review-text">
                        {review.comment || 'Sans commentaire.'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
