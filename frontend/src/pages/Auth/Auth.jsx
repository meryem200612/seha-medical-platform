import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Auth.css';

export default function Auth() {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'patient',
    specialty_id: '',
    price: ''
  });
  const [specialties, setSpecialties] = useState([]);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'role' && value === 'patient') {
        newData.specialty_id = '';
        newData.price = '';
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (activeTab === 'login') {
        await login(formData.email, formData.password);
      } else {
        // Prepare registration data
        const registrationData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          role: formData.role
        };

        
        if (formData.role === 'doctor') {
          registrationData.specialty_id = formData.specialty_id;
          registrationData.price = formData.price;
        }

        await register(registrationData);
      }
      navigate('/');
    } catch (err) {
      console.error("Auth error:", err);
      if (err.response?.data?.errors) {
       
        const firstError = Object.values(err.response.data.errors)[0][0];
        setError(firstError);
      } else {
        setError(err.response?.data?.message || err.message || 'Une erreur est survenue.');
      }
    }
  };

  return (
    <div className="app-page">
      <div className="auth-layout">
        <div className="auth-left">
          <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}> <img src="logoseha.png" alt="Logo" style={{ width: '250px', height: '250px' }} />

          </div>
          <h2>Votre santé, notre priorité</h2>
          <p>Accédez à des consultations médicales de qualité depuis chez vous, 7j/7 avec des médecins certifiés.</p>
          
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <img src="consulting.png" alt="" style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '700', marginBottom: '2px' }}>Consultations vidéo HD</div>
              <div style={{ fontSize: '12px', opacity: '.75' }}>Connexion sécurisée et chiffrée</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <img src="notification.png" alt="" style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <div style={{ fontWeight: '700', marginBottom: '2px' }}>Rappels automatiques</div>
              <div style={{ fontSize: '12px', opacity: '.75' }}>Ne manquez plus aucun médicament </div>
            </div>
          </div>

        </div>
        
        <div className="auth-right">
          <h3>Bienvenue sur Seha</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '20px' }}>Connectez-vous ou créez votre compte</p>
          
          <div className="tab-switch">
            <div 
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Connexion
            </div>
            <div 
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Inscription
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '10px' }}>{error}</div>}

            {activeTab === 'register' && (
              <>
              <div className="form-group">
  <label className="form-label">Je suis un</label>

             <div className="role-selector">
    
           <button
          type="button"
          className={`role-card ${formData.role === 'patient' ? 'active' : ''}`}
           onClick={() =>
          setFormData(prev => ({
          ...prev,
          role: 'patient',
          specialty_id: '',
          price: ''
        }))
      }
    >
      <div className="role-icon"><img src="people.png" alt="" /></div>
      <h4>Patient</h4>
      <p>Prendre rendez-vous avec un médecin</p>
    </button>

    <button
      type="button"
      className={`role-card ${formData.role === 'doctor' ? 'active' : ''}`}
      onClick={() =>
        setFormData(prev => ({
          ...prev,
          role: 'doctor'
        }))
      }
    >
      <div className="role-icon"><img src="doctor (2).png" alt="" /></div>
      <h4>Médecin</h4>
      <p>Gérer vos consultations et patients</p>
    </button>

  </div>
</div>
{formData.role === 'doctor' && (
  
 <>
 <div className="form-group">
<label className="form-label">Spécialité</label>
<select 
 className="form-input" 
 name="specialty_id"
value={formData.specialty_id}
onChange={handleChange}
required
                      >
                        <option value="">Sélectionnez une spécialité</option>
                        {specialties.map((spec) => (
                          <option key={spec.id} value={spec.id}>
                            {spec.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Prix de consultation (MAD)</label>
                      <input 
                        className="form-input" 
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="200.00" 
                        required 
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <input 
                  className="form-input" 
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Prénom Nom" 
                  required 
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                className="form-input" 
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input 
                className="form-input" 
                name="password"
                type="password" 
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••" 
                required 
              />
            </div>

            {activeTab === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe</label>
                <input 
                  className="form-input" 
                  name="password_confirmation"
                  type="password" 
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  required 
                />
              </div>
            )}
            
            {activeTab === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <a style={{ fontSize: '12px', color: 'var(--blue)', cursor: 'pointer' }}>Mot de passe oublié ?</a>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', marginBottom: '16px' }}>
              {activeTab === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>
          

        </div>
      </div>
    </div>
  );
}