import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import PageHero from '../../components/PageHero';
import './EditProgram.css';

export default function EditProgram() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const programId = searchParams.get('id');

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    description: '',
    content: '',
    price: '',
    duration: '',
  });
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!programId) {
        setError('ID du programme manquant.');
        setLoading(false);
        return;
      }

      try {
        const [specialtiesResponse, programResponse] = await Promise.all([
          api.get('/specialties'),
          api.get(`/doctor/programs/${programId}`),
        ]);

        setSpecialties(specialtiesResponse.data || []);
        const prog = programResponse.data;
        setForm({
          name: prog.title || '',
          specialty: prog.category || '',
          description: prog.description || '',
          content: prog.content || '',
          price: prog.price?.toString() || '',
          duration: prog.duration_weeks?.toString() || '',
        });
      } catch (loadError) {
        console.error('Erreur de chargement du programme :', loadError);
        setError(loadError.response?.data?.message || 'Impossible de charger le programme.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [programId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.put(`/doctor/programs/${programId}`, {
        name: form.name,
        specialty: form.specialty,
        description: form.description,
        content: form.content,
        price: parseFloat(form.price),
        duration: parseInt(form.duration, 10),
      });
      navigate('/programs');
    } catch (submitError) {
      console.error('Erreur de mise à jour du programme :', submitError);
      setError(submitError.response?.data?.message || 'Impossible de mettre à jour le programme.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-page">
        <h2>Chargement du programme...</h2>
      </div>
    );
  }

  return (
    <div className="app-page">
      <PageHero
        image="/programme.png"
        overline="Programmes"
        title={<>Modifier le <span>programme</span></>}
        lead="Mettez a jour les details de votre programme."
      />
      <div className="app-page-body" style={{ maxWidth: '920px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <Link to="/programs" className="btn btn-outline">Retour aux programmes</Link>
        </div>
        <form className="create-program-form ds-card" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-row">
            <label>Nom du programme</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <label>Spécialité</label>
            <select name="specialty" value={form.specialty} onChange={handleChange} required>
              <option value="">Sélectionnez une spécialité</option>
              {specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.name}>{specialty.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Description courte</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" required />
          </div>

          <div className="form-row">
            <label>Détails du programme</label>
            <textarea name="content" value={form.content} onChange={handleChange} rows="6" required />
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Prix (MAD)</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" required />
            </div>
            <div className="form-row">
              <label>Durée (semaines)</label>
              <input type="number" name="duration" value={form.duration} onChange={handleChange} min="1" required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Mettre à jour le programme'}
          </button>
        </form>
      </div>
    </div>
  );
}
