import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import './Programs.css';

const CATEGORY_STYLES = {
  nutrition: { image: '/programs0.png', accent: '#2a9da0' },
  alimentation: { image: '/programs0.png', accent: '#2a9da0' },
  fitness: { image: '/programs1.png', accent: '#2563eb' },
  sport: { image: '/programs1.png', accent: '#2563eb' },
  mental: { image: '/programs3.png', accent: '#7c3aed' },
  psychologie: { image: '/programs3.png', accent: '#7c3aed' },
  default: { image: '/programs0.png', accent: '#2a9da0' },
};

function getCategoryStyle(category) {
  const key = (category || '').toLowerCase();
  const match = Object.keys(CATEGORY_STYLES).find(
    (k) => k !== 'default' && key.includes(k),
  );
  return CATEGORY_STYLES[match] ?? CATEGORY_STYLES.default;
}

function getDoctorInitials(name) {
  return (name || 'DR')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Programs() {
  const { user } = useContext(AuthContext);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const safePrograms = Array.isArray(programs) ? programs : [];
  const isDoctor = user?.role === 'doctor';

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get('/doctor/programs');
        const payload = response?.data;
        const programArray = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        setPrograms(programArray);
      } catch (fetchError) {
        console.error('Error loading doctor programs:', fetchError);
        setError('Impossible de charger vos programmes pour le moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  return (
    <div className="programs-page">
      <header className="programs-page-header">
        <div className="programs-header-visual" aria-hidden="true">
          <img src="/programs3.png" alt="" />
        </div>
        <div className="programs-header-content">
          <p className="programs-overline">Suivi personnalise</p>
          <h1 className="programs-heading">
            Programmes de <span>sante sur mesure</span>
          </h1>
          <p className="programs-lead">
            Des parcours de soins complets, organises par votre medecin et adaptes a vos objectifs de sante.
          </p>
          {!loading && !error && (
            <div className="programs-stats">
              <div className="programs-stat">
                <span className="programs-stat-num">{safePrograms.length}</span>
                <span className="programs-stat-label">
                  Programme{safePrograms.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="programs-stat">
                <span className="programs-stat-num">100%</span>
                <span className="programs-stat-label">Personnalises</span>
              </div>
              <div className="programs-stat">
                <span className="programs-stat-num">7j/7</span>
                <span className="programs-stat-label">Suivi medical</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="programs-page-body">
        <div className="programs-toolbar">
          <div className="programs-toolbar-text">
            <h2 className="programs-section-title">
              {isDoctor ? 'Mes programmes' : 'Programmes disponibles'}
            </h2>
            {!loading && safePrograms.length > 0 && (
              <p className="programs-toolbar-sub">
                {safePrograms.length} parcours a explorer
              </p>
            )}
          </div>
          {isDoctor && (
            <Link to="/create_program.php" className="btn-new-program">
              <span className="btn-new-program-icon">+</span>
              Nouveau programme
            </Link>
          )}
        </div>

        {loading ? (
          <div className="programs-loading">
            <div className="programs-skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="prog-card prog-card--skeleton" />
              ))}
            </div>
            <p>Chargement des programmes...</p>
          </div>
        ) : error ? (
          <div className="programs-empty">
            <div className="programs-empty-icon" aria-hidden="true">!</div>
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
          </div>
        ) : safePrograms.length === 0 ? (
          <div className="programs-empty">
            <img src="/programme.png" alt="" className="programs-empty-img" />
            <h3>Aucun programme pour le moment</h3>
            <p>
              {isDoctor
                ? 'Creez votre premier programme de sante personnalise pour vos patients.'
                : 'Revenez bientot - de nouveaux parcours seront disponibles.'}
            </p>
            {isDoctor && (
              <Link to="/create_program.php" className="btn-new-program">
                Creer un programme
              </Link>
            )}
          </div>
        ) : (
          <div className="programs-grid">
            {safePrograms.map((program, index) => {
              const style = getCategoryStyle(program.category);
              const doctorName = program.doctor?.name;

              return (
                <article
                  className="prog-card"
                  key={program.id}
                  style={{
                    '--prog-accent': style.accent,
                    '--prog-delay': `${index * 0.07}s`,
                  }}
                >
                  <div
                    className="prog-banner"
                    style={{ backgroundImage: `url(${style.image})` }}
                  >
                    <span className="prog-category-badge">
                      {program.category || 'Programme'}
                    </span>
                  </div>

                  <div className="prog-body">
                    <h3 className="prog-name">{program.title}</h3>
                    {program.description && (
                      <p className="prog-desc">{program.description}</p>
                    )}

                    {doctorName && (
                      <div className="prog-author-row">
                        <span className="prog-author-avatar">
                          {getDoctorInitials(doctorName)}
                        </span>
                        <span className="prog-author-info">
                          <span className="prog-author-name">{doctorName}</span>
                          {program.doctor.specialty && (
                            <span className="prog-author-spec">
                              {program.doctor.specialty}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    <div className="prog-chips">
                      <span className="prog-chip">
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {program.duration_weeks} semaines
                      </span>
                      <span className="prog-chip prog-chip--price">
                        {program.price} MAD
                      </span>
                    </div>
                  </div>

                  <div className="prog-footer">
                    <div className="prog-price-block">
                      <span className="prog-price">{program.price}</span>
                      <span className="prog-price-unit">MAD - {program.duration_weeks} sem.</span>
                    </div>
                    {isDoctor ? (
                      <Link
                        to={`/edit_program.php?id=${program.id}`}
                        className="prog-btn prog-btn--primary"
                      >
                        Modifier
                      </Link>
                    ) : (
                      <Link
                        to={`/programmes/${program.id}`}
                        className="prog-btn prog-btn--primary"
                      >
                        Decouvrir
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
