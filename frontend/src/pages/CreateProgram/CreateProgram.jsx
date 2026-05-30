import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import PageHero from '../../components/PageHero';
import './CreateProgram.css';

export default function CreateProgram() {
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    description: '',
    content: '',
    price: '',
    duration: '',
  });
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const response = await api.get('/specialties');
        setSpecialties(response.data || []);
      } catch (fetchError) {
        console.error('Impossible de charger les spécialités:', fetchError);
      }
    };

    loadSpecialties();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/doctor/programs', {
        name: form.name,
        specialty: form.specialty,
        description: form.description,
        content: form.content,
        price: parseFloat(form.price),
        duration: parseInt(form.duration, 10),
      });
      navigate('/programs');
    } catch (submitError) {
      console.error('Erreur lors de la création du programme:', submitError);
      const serverMessage = submitError.response?.data?.message || submitError.message;
      const sqlError = submitError.response?.data?.error;
      setError(sqlError ? `${serverMessage}: ${sqlError}` : serverMessage || 'Impossible de créer le programme. Veuillez vérifier vos informations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <PageHero
        image="/programme.png"
        overline="Programmes"
        title={<>Nouveau <span>programme</span></>}
        lead="Creez un programme lie a votre compte et a vos patients."
      />
      <div className="app-page-body" style={{ maxWidth: '920px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <Link to="/programs" className="btn btn-outline">Retour aux programmes</Link>
        </div>
        <form className="create-program-form ds-card" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-row">
            <label>Nom du programme</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Ex: Programme de remise en forme" required />
          </div>

          <div className="form-row">
            <label>Spécialité</label>
            <select name="specialty" value={form.specialty} onChange={handleChange} required>
              <option value="">Sélectionnez une spécialité</option>
              {specialties.length > 0 ? specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.name}>{specialty.name}</option>
              )) : <option value="">Aucune spécialité chargée</option>}
            </select>
          </div>

          <div className="form-row">
            <label>Description courte</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Résumé du programme" required />
          </div>

          <div className="form-row">
            <label>Détails du programme</label>
            <textarea name="content" value={form.content} onChange={handleChange} rows="6" placeholder="Contenu détaillé du plan" required />
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Prix (MAD)</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" placeholder="250.00" required />
            </div>
            <div className="form-row">
              <label>Durée (semaines)</label>
              <input type="number" name="duration" value={form.duration} onChange={handleChange} min="1" placeholder="4" required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Créer le programme'}
          </button>
        </form>
      </div>
    </div>
  );
}
