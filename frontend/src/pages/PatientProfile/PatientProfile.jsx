import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DoctorAvatar from '../../components/DoctorAvatar';
import './PatientProfile.css';

const VITALS = [
  { key: 'heart_rate', label: 'Fréquence cardiaque', unit: 'bpm', icon: <img src="/heart-rate.png" alt="Fréquence cardiaque" />, variant: 'heart', type: 'number' },
  { key: 'blood_pressure', label: 'Tension artérielle', unit: '', icon: '🩸', variant: 'pressure', type: 'text' },
  { key: 'temperature', label: 'Température', unit: '°C', icon: '🌡️', variant: 'temp', type: 'number', step: '0.1' },
  { key: 'weight', label: 'Poids', unit: 'kg', icon: <img src="/weight-scale.png" alt="Poids" />, variant: 'weight', type: 'number', step: '0.1' },
  { key: 'oxygen_saturation', label: 'Saturation O₂', unit: '%', icon: '🫁', variant: 'oxygen', type: 'number' },
  { key: 'glycemia', label: 'HbA1c (glycémie)', unit: '%', icon: '🩺', variant: 'glycemia', type: 'number', step: '0.1' },
];

const TABS = [
  { id: 'vitales', label: 'Constantes vitales', icon: '◉' },
  { id: 'rdv', label: 'Historique RDV', icon: '▦' },
  { id: 'medecins', label: 'Mes médecins', icon: '◎' },
];

function computeWellness(profile) {
  const checks = [
    profile.heart_rate > 0,
    profile.blood_pressure && profile.blood_pressure !== '0/0',
    profile.temperature > 0,
    profile.weight > 0,
    profile.oxygen_saturation > 0,
    profile.glycemia > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function vitalDisplayValue(key, profile, formData, isEditing) {
  const raw = isEditing ? formData[key] : profile[key];
  if (key === 'blood_pressure') return raw || '0/0';
  return raw || 0;
}

function vitalHasValue(key, profile) {
  if (key === 'blood_pressure') return profile.blood_pressure && profile.blood_pressure !== '0/0';
  return (profile[key] || 0) > 0;
}

function getInitials(name) {
  return (name || '??')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatMemberSince(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function PatientProfile() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('vitales');
  const [history, setHistory] = useState({
    appointments: [],
    prescriptions: [],
    analyses: [],
    doctors: [],
  });
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await api.get('/patient/history');
        setHistory(response.data);
      } catch (err) {
        console.error('Error fetching history', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="patient-profile-page">
        <div className="patient-profile-gate">
          Veuillez vous connecter pour voir votre profil.
        </div>
      </div>
    );
  }

  const profile = user.patient_profile || {};
  const initials = getInitials(user.name);

  const handleEdit = () => {
    setFormData({
      age: profile.age || '',
      gender: profile.gender || '',
      city: profile.city || '',
      phone: profile.phone || '',
      blood_group: profile.blood_group || '',
      allergies: profile.allergies || '',
      heart_rate: profile.heart_rate || 0,
      blood_pressure: profile.blood_pressure || '0/0',
      temperature: profile.temperature || 0,
      weight: profile.weight || 0,
      oxygen_saturation: profile.oxygen_saturation || 0,
      glycemia: profile.glycemia || 0,
      medical_history: profile.medical_history || '',
      current_treatments: profile.current_treatments || '',
    });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/patient/profile', formData);
      setUser(response.data.user);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile', err);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const allergies = profile.allergies
    ? profile.allergies.split(',').map((a) => a.trim()).filter(Boolean)
    : [];
  const wellness = computeWellness(profile);

  return (
    <div className="patient-profile-page">
      <header className="patient-profile-header">
        <div className="patient-header-visual" aria-hidden="true">
          <img src="/profile.jpeg" alt="" />
        </div>
        <div className="patient-header-pattern" aria-hidden="true" />
        <div className="patient-header-content">
          <div className="patient-avatar-wrap">
            <div className="patient-avatar-ring" style={{ '--wellness': `${wellness}%` }} />
            <div className="patient-header-avatar">{initials}</div>
            {profile.blood_group ? (
              <span className="patient-blood-badge">{profile.blood_group}</span>
            ) : null}
          </div>
          <div className="patient-wellness-chip">
            <span className="patient-wellness-num">{wellness}%</span>
            <span className="patient-wellness-lbl">Dossier complété</span>
          </div>
          <div className="patient-header-text">
            <p className="patient-overline">Mon dossier médical</p>
            <h1 className="patient-heading">{user.name}</h1>
            <p className="patient-subtitle">
              Patient depuis {formatMemberSince(user.created_at)}
            </p>
          </div>
          <div className="patient-header-stats">
            <div className="patient-stat-pill">
              <span className="patient-header-stat-num">{history.appointments.length}</span>
              <span className="patient-header-stat-label">Consultations</span>
            </div>
            <div className="patient-stat-pill">
              <span className="patient-header-stat-num">{history.doctors.length}</span>
              <span className="patient-header-stat-label">Médecins</span>
            </div>
          </div>
          <div className="patient-header-actions">
            <Link to="/doctors" className="profile-btn profile-btn--primary">
              Prendre RDV
            </Link>
            <Link to="/messages" className="profile-btn profile-btn--outline">
              Messages
            </Link>
          </div>
        </div>
      </header>

      <div className="patient-quick-bar">
        <Link to="/doctors" className="patient-quick-item">
          <span className="patient-quick-icon">+</span>
          <span>Nouveau RDV</span>
        </Link>
        <Link to="/messages" className="patient-quick-item">
          <span className="patient-quick-icon">✉</span>
          <span>Messages</span>
        </Link>
        <Link to="/medications" className="patient-quick-item">
          <span className="patient-quick-icon">◈</span>
          <span>Médicaments</span>
        </Link>
        <Link to="/programs" className="patient-quick-item">
          <span className="patient-quick-icon">◎</span>
          <span>Programmes</span>
        </Link>
      </div>

      <div className="patient-profile-body">
        <div className="patient-profile-layout">
          <aside className="patient-sidebar">
            <section className="patient-sidebar-section">
              <h2 className="patient-sidebar-title">Informations personnelles</h2>
              <div className="patient-info-row">
                <span className="patient-info-icon">
                  <img src="/user.png" alt="Utilisateur" />
                </span>
                <span>{user.name}</span>
              </div>
              <div className="patient-info-row">
                <span className="patient-info-icon">
                  <img src="/birthday-cake.png" alt="Anniversaire" />
                </span>
                <span>
                  {isEditing ? (
                    <span className="patient-inline-inputs">
                      <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Âge" />
                      <span>ans ·</span>
                      <select name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">Genre</option>
                        <option value="H">H</option>
                        <option value="F">F</option>
                      </select>
                    </span>
                  ) : (
                    `${profile.age || '—'} ans · ${profile.gender || '—'}`
                  )}
                </span>
              </div>
              <div className="patient-info-row">
                <span className="patient-info-icon">
                  <img src="/pin.png" alt="Emplacement" />
                </span>
                <span>
                  {isEditing ? (
                    <input name="city" value={formData.city} onChange={handleChange} placeholder="Ville" />
                  ) : (
                    profile.city || '—'
                  )}
                </span>
              </div>
              <div className="patient-info-row">
                <span className="patient-info-icon">
                  <img src="/phone.png" alt="Téléphone" />
                </span>
                <span>
                  {isEditing ? (
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Téléphone" />
                  ) : (
                    profile.phone || '—'
                  )}
                </span>
              </div>
              <div className="patient-info-row">
                <span className="patient-info-icon">
                  <img src="/email.png" alt="Email" />
                </span>
                <span>{user.email}</span>
              </div>
              <div className="patient-info-row">
                <span className="patient-info-icon">
                  <img src="/diabetes.png" alt="Groupe sanguin" />
                </span>
                <span>
                  Groupe sanguin :{' '}
                  {isEditing ? (
                    <select name="blood_group" value={formData.blood_group} onChange={handleChange}>
                      <option value="">—</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  ) : (
                    profile.blood_group || '—'
                  )}
                </span>
              </div>
            </section>

            <section className="patient-sidebar-section">
              <h2 className="patient-sidebar-title">Allergies connues</h2>
              {isEditing ? (
                <input
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="Pénicilline, Aspirine…"
                />
              ) : allergies.length > 0 ? (
                <div className="patient-allergy-tags">
                  {allergies.map((a) => (
                    <span key={a} className="patient-allergy-tag">{a}</span>
                  ))}
                </div>
              ) : (
                <p className="patient-empty-hint">Aucune allergie répertoriée</p>
              )}
            </section>

            {isEditing ? (
              <div className="patient-sidebar-actions">
                <button type="button" className="profile-btn profile-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" className="profile-btn profile-btn--outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  Annuler
                </button>
              </div>
            ) : (
              <button type="button" className="profile-btn profile-btn--outline" style={{ width: '100%' }} onClick={handleEdit}>
                Modifier le profil
              </button>
            )}
          </aside>

          <main className="patient-main">
            <div className="patient-tabs" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  className={`patient-tab${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="patient-tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingHistory && activeTab !== 'vitales' ? (
              <p className="tab-loading">Chargement…</p>
            ) : null}

            {activeTab === 'vitales' && (
              <>
                <div className="vital-grid">
                  {VITALS.map((v) => {
                    const hasVal = vitalHasValue(v.key, profile);
                    const display = vitalDisplayValue(v.key, profile, formData, isEditing);
                    return (
                      <div key={v.key} className={`vital-card vital-card--${v.variant}`}>
                        <div className="vital-card-top">
                          <span className="vital-icon">{v.icon}</span>
                          <span className={`vital-status ${hasVal ? 'vs-normal' : ''}`}>
                            {hasVal ? 'Enregistré' : 'À compléter'}
                          </span>
                        </div>
                        <div className="vital-val">
                          {isEditing ? (
                            <input
                              type={v.type}
                              step={v.step}
                              name={v.key}
                              value={formData[v.key]}
                              onChange={handleChange}
                            />
                          ) : (
                            <>
                              {display}
                              {v.unit ? ` ${v.unit}` : ''}
                            </>
                          )}
                        </div>
                        <div className="vital-lbl">{v.label}</div>
                        <div className="vital-bar">
                          <span className="vital-bar-fill" style={{ width: hasVal ? '100%' : '12%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="health-card">
                  <h3 className="health-card-title">Antécédents médicaux</h3>
                  {isEditing ? (
                    <textarea
                      name="medical_history"
                      value={formData.medical_history}
                      onChange={handleChange}
                      placeholder="Un antécédent par ligne…"
                    />
                  ) : profile.medical_history ? (
                    profile.medical_history.split('\n').filter(Boolean).map((h) => (
                      <div key={h} className="health-row">
                        <span className="health-lbl">{h}</span>
                      </div>
                    ))
                  ) : (
                    <p className="patient-empty-hint">Aucun antécédent répertorié</p>
                  )}
                </div>

                <div className="health-card">
                  <h3 className="health-card-title">Traitements en cours</h3>
                  {isEditing ? (
                    <textarea
                      name="current_treatments"
                      value={formData.current_treatments}
                      onChange={handleChange}
                      placeholder="Un traitement par ligne…"
                    />
                  ) : profile.current_treatments ? (
                    profile.current_treatments.split('\n').filter(Boolean).map((t) => (
                      <div key={t} className="health-row">
                        <span className="health-lbl">{t}</span>
                      </div>
                    ))
                  ) : (
                    <p className="patient-empty-hint">Aucun traitement en cours</p>
                  )}
                </div>
              </>
            )}

            {activeTab === 'rdv' && !loadingHistory && (
              <div className="health-card">
                <h3 className="health-card-title">Historique des rendez-vous</h3>
                {history.appointments.length > 0 ? (
                  <ul className="patient-rdv-list">
                    {history.appointments.map((rdv) => (
                      <li key={rdv.id} className="patient-rdv-card">
                        <div className="patient-rdv-date">
                          <span className="patient-rdv-day">
                            {new Date(rdv.date).toLocaleDateString('fr-FR', { day: 'numeric' })}
                          </span>
                          <span className="patient-rdv-month">
                            {new Date(rdv.date).toLocaleDateString('fr-FR', { month: 'short' })}
                          </span>
                        </div>
                        <div className="patient-rdv-body">
                          <span className="patient-rdv-doctor">{rdv.doctor?.name}</span>
                          <span className="patient-rdv-meta">
                            {rdv.time_slot} · {rdv.type === 'video' ? 'Vidéo' : 'Cabinet'}
                          </span>
                        </div>
                        <span className={`status-badge status-${rdv.status}`}>
                          {rdv.status === 'confirmed'
                            ? 'Confirmé'
                            : rdv.status === 'pending'
                              ? 'En attente'
                              : 'Annulé'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tab-empty">Aucun rendez-vous trouvé.</p>
                )}
              </div>
            )}

            {activeTab === 'medecins' && !loadingHistory && (
              <div className="health-card">
                <h3 className="health-card-title">Mes médecins habituels</h3>
                {history.doctors.length > 0 ? (
                  <div className="doctors-mini-grid">
                    {history.doctors.map((doc) => (
                      <div key={doc.id} className="doctor-mini-card">
                        <DoctorAvatar doctor={doc} name={doc.name} size="md" className="doctor-mini-avatar" />
                        <div className="doctor-mini-name">{doc.name}</div>
                        <div className="doctor-mini-spec">{doc.specialty?.name ?? 'Médecin'}</div>
                        <Link to={`/doctor/${doc.id}`} className="profile-btn profile-btn--primary profile-btn--sm">
                          Prendre RDV
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="tab-empty">Vous n&apos;avez pas encore consulté de médecin.</p>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
