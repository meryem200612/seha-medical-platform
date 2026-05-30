import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import PageHero from '../../components/PageHero';
import './DoctorsList.css';

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

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    specialty_id: '',
    city: '',
    price: '',
    sort: 'relevance',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await api.get('/specialties');
        setSpecialties(response.data);
      } catch (error) {
        console.error('Error fetching specialties', error);
      }
    };
    fetchSpecialties();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filters.specialty_id) params.append('specialty_id', filters.specialty_id);
      if (filters.city) params.append('city', filters.city);
      if (filters.price) params.append('price', filters.price);
      if (filters.sort !== 'relevance') params.append('sort', filters.sort);
      params.append('page', String(page));

      const response = await api.get(`/doctors?${params.toString()}`);
      const body = response.data;
      setDoctors(Array.isArray(body.data) ? body.data : []);
      setPagination({
        current_page: body.current_page ?? 1,
        last_page: body.last_page ?? 1,
        per_page: body.per_page ?? 12,
        total: body.total ?? 0,
      });
    } catch (error) {
      console.error('Error fetching doctors', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.specialty_id, filters.city, filters.price, filters.sort, page]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const toggleSpecialty = (id) => {
    setFilters((prev) => ({
      ...prev,
      specialty_id: prev.specialty_id === id ? '' : id,
    }));
    setPage(1);
  };

  const pageItems = buildPageItems(pagination.current_page, pagination.last_page);

  return (
    <div className="app-page">
      <PageHero
        image="/hero3.jpeg"
        overline="Annuaire"
        title={<>Trouver un <span>medecin</span></>}
        lead="Parcourez notre reseau de medecins certifies."
      />
      <div className="app-page-body" style={{ display: 'flex', gap: '24px' }}>
        <div className="filters-sidebar">
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Filtres</div>

          <div className="filter-section">
            <div className="filter-title">Recherche</div>
            <input
              type="text"
              placeholder="Nom du médecin..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid var(--gray-3)', outline: 'none', fontSize: '13px' }}
            />
          </div>

          <div className="filter-section">
            <div className="filter-title">Ville</div>
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid var(--gray-3)', outline: 'none', fontSize: '13px' }}
            >
              <option value="">Toutes les villes</option>
              <option value="Casablanca">Casablanca</option>
              <option value="Rabat">Rabat</option>
              <option value="Marrakech">Marrakech</option>
              <option value="Tanger">Tanger</option>
            </select>
          </div>

          <div className="filter-section">
            <div className="filter-title">Spécialité</div>
            {specialties.map((spec) => (
              <div
                key={spec.id}
                className="filter-option"
                onClick={() => toggleSpecialty(String(spec.id))}
              >
                <div className={`checkbox ${String(filters.specialty_id) === String(spec.id) ? 'checked' : ''}`}>
                  {String(filters.specialty_id) === String(spec.id) ? '✓' : ''}
                </div>
                {spec.name}
              </div>
            ))}
          </div>

          <div className="filter-section">
            <div className="filter-title">Tarif de consultation</div>
            <div className="price-options">
              <label className="price-option">
                <input
                  type="radio"
                  name="price"
                  value=""
                  checked={filters.price === ''}
                  onChange={(e) => handleFilterChange('price', e.target.value)}
                />
                <span>Tous les prix</span>
              </label>
              <label className="price-option">
                <input
                  type="radio"
                  name="price"
                  value="low"
                  checked={filters.price === 'low'}
                  onChange={(e) => handleFilterChange('price', e.target.value)}
                />
                <span>&lt; 300 MAD</span>
              </label>
              <label className="price-option">
                <input
                  type="radio"
                  name="price"
                  value="medium"
                  checked={filters.price === 'medium'}
                  onChange={(e) => handleFilterChange('price', e.target.value)}
                />
                <span>300 - 600 MAD</span>
              </label>
              <label className="price-option">
                <input
                  type="radio"
                  name="price"
                  value="high"
                  checked={filters.price === 'high'}
                  onChange={(e) => handleFilterChange('price', e.target.value)}
                />
                <span>&gt; 600 MAD</span>
              </label>
            </div>
          </div>

          <button
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '8px' }}
            type="button"
            onClick={() => {
              setFilters({ search: '', specialty_id: '', city: '', price: '', sort: 'relevance' });
              setPage(1);
            }}
          >
            Réinitialiser
          </button>
        </div>

        <div className="doctors-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-3)' }}>
              <strong style={{ color: 'var(--text)' }}>{pagination.total} médecin{pagination.total !== 1 ? 's' : ''}</strong> trouvé{pagination.total !== 1 ? 's' : ''}
              {pagination.last_page > 1 ? (
                <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>
                  {' '}
                  · page {pagination.current_page}/{pagination.last_page}
                </span>
              ) : null}
            </div>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid var(--gray-3)', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
            >
              <option value="relevance">Trier : Pertinence</option>
              <option value="price_asc">Prix croissant</option>
              <option value="rating_desc">Mieux notés</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>Chargement des médecins...</div>
          ) : (
            <div className="doctors-grid">
              {doctors.map((doc) => (
                <Link key={doc.id} to={`/doctor/${doc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="doc-card">
                    <div className="doc-info">
                      <h3>{doc.name || 'Médecin'}</h3>
                      <div className="doc-specialty">{doc.specialty?.name ?? 'Médecin'}</div>
                    </div>
                    <div className="doc-footer">
                      <div className="doc-price">{doc.price != null ? `${doc.price} MAD` : '-- MAD'}</div>
                    </div>
                  </div>
                </Link>
              ))}

              {doctors.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
                  <h3>Aucun médecin trouvé</h3>
                  <p style={{ color: 'var(--text-3)' }}>Essayez d&apos;ajuster vos filtres pour obtenir plus de résultats.</p>
                </div>
              )}
            </div>
          )}

          {!loading && pagination.last_page > 1 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Précédent
              </button>
              {pageItems.map((item) =>
                item.type === 'gap' ? (
                  <span key={item.key} style={{ color: 'var(--text-3)', padding: '0 4px' }}>
                    …
                  </span>
                ) : (
                  <button
                    key={item.value}
                    type="button"
                    className={`btn btn-sm ${item.value === page ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPage(item.value)}
                  >
                    {item.value}
                  </button>
                ),
              )}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              >
                Suivant →
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
