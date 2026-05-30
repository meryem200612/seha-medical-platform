import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Medications.css';

const emptyForm = {
  medicine_name: '',
  dosage: '',
  reminder_time: '',
  notes: '',
};

function getMedicineInitials(name) {
  return (name || 'Rx')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatReminderTime(time) {
  if (!time) return '';
  const part = time.slice(0, 5);
  const [h, m] = part.split(':');
  return `${h}h${m}`;
}

export default function Medications() {
  const { user, setUser } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const notificationsSentRef = useRef(new Set());

  const subscribed = user?.patient_profile?.medication_subscription_active;
  const isPatient = user?.role === 'patient';

  useEffect(() => {
    if (!subscribed || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [subscribed]);

  useEffect(() => {
    if (!subscribed || typeof window === 'undefined' || !('Notification' in window)) {
      return undefined;
    }

    const notifyMedications = () => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      const activeKeys = new Set();

      medications.forEach((med) => {
        const reminderTime = med.reminder_time?.slice(0, 5);
        if (!reminderTime) return;

        const key = `${med.id}-${reminderTime}`;
        if (reminderTime === currentTime) {
          activeKeys.add(key);
          if (!notificationsSentRef.current.has(key)) {
            try {
              new Notification('Rappel de médicament', {
                body: `${med.medicine_name} (${med.dosage})`,
                tag: key,
                renotify: false,
              });
            } catch (notificationError) {
              console.error('Erreur de notification:', notificationError);
            }
            notificationsSentRef.current.add(key);
          }
        }
      });

      notificationsSentRef.current.forEach((sentKey) => {
        if (!activeKeys.has(sentKey)) {
          notificationsSentRef.current.delete(sentKey);
        }
      });
    };

    notifyMedications();
    const intervalId = window.setInterval(notifyMedications, 60000);
    return () => {
      window.clearInterval(intervalId);
      notificationsSentRef.current.clear();
    };
  }, [subscribed, medications]);

  useEffect(() => {
    if (isPatient && subscribed) {
      fetchMedications();
    }
  }, [isPatient, subscribed]);

  const fetchMedications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/medications');
      setMedications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setMedications([]);
      setError(err?.response?.data?.message || 'Erreur lors du chargement des médicaments.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/patient/medication-subscription');
      setUser(response.data.user);
      setSuccess('Abonnement activé avec succès.');
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors de l'abonnement.");
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Voulez-vous vraiment annuler votre abonnement aux rappels de médicaments ?')) {
      return;
    }
    setSubscribing(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/patient/medication-subscription/cancel');
      setUser(response.data.user);
      setSuccess(response.data.message || 'Abonnement annulé avec succès.');
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors de l'annulation de l'abonnement.");
    } finally {
      setSubscribing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!form.medicine_name || !form.dosage || !form.reminder_time) {
      setError('Veuillez remplir le nom du médicament, le dosage et l\'heure de rappel.');
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/medications/${editingId}`, form);
      } else {
        await api.post('/medications', form);
      }
      resetForm();
      fetchMedications();
      setSuccess(editingId ? 'Médicament mis à jour.' : 'Médicament ajouté.');
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors de l'enregistrement du médicament.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (medication) => {
    setEditingId(medication.id);
    setForm({
      medicine_name: medication.medicine_name,
      dosage: medication.dosage,
      reminder_time: medication.reminder_time?.slice(0, 5) || medication.reminder_time,
      notes: medication.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce médicament ?')) return;
    setSaving(true);
    setError('');
    try {
      await api.delete(`/medications/${id}`);
      fetchMedications();
      setSuccess('Médicament supprimé.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Test de rappel', { body: 'Test de notification de médicament' });
        }
      });
    } else {
      new Notification('Test de rappel', { body: 'Test de notification de médicament' });
    }
  };

  if (!user) {
    return (
      <div className="medications-page">
        <div className="medications-gate">
          Veuillez vous connecter pour accéder à votre abonnement.
        </div>
      </div>
    );
  }

  if (!isPatient) {
    return (
      <div className="medications-page">
        <div className="medications-gate">
          Cette page est réservée aux patients.
        </div>
      </div>
    );
  }

  return (
    <div className="medications-page">
      <header className="medications-page-header">
        <div className="medications-header-visual" aria-hidden="true">
          <img src="/abonnement1.jpeg" alt="" />
        </div>
        <div className="medications-header-content">
          <p className="medications-overline">Rappels intelligents</p>
          <h1 className="medications-heading">
            Mon <span>abonnement santé</span>
          </h1>
          <p className="medications-lead">
            Gérez vos médicaments et recevez des rappels personnalisés au bon moment, chaque jour.
          </p>
          <div className="medications-stats">
            <div className={`medications-stat${subscribed ? ' medications-stat--active' : ''}`}>
              <span className="medications-stat-num">{subscribed ? 'Actif' : '—'}</span>
              <span className="medications-stat-label">Abonnement</span>
            </div>
            <div className="medications-stat">
              <span className="medications-stat-num">{medications.length}</span>
              <span className="medications-stat-label">Médicament{medications.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="medications-stat">
              <span className="medications-stat-num">50</span>
              <span className="medications-stat-label">MAD / mois</span>
            </div>
          </div>
        </div>
      </header>

      <div className="medications-page-body">
        <div className={`subscription-panel${subscribed ? ' subscription-panel--active' : ''}`}>
          <div className="subscription-info">
            <span className={`subscription-badge${subscribed ? ' subscription-badge--active' : ' subscription-badge--inactive'}`}>
              <span className="subscription-badge-dot" />
              {subscribed ? 'Abonnement actif' : 'Non abonné'}
            </span>
            <h2>Abonnement Santé</h2>
            <p className="subscription-desc">
              {subscribed
                ? 'Votre abonnement est actif. Ajoutez vos médicaments et recevez des rappels automatiques.'
                : 'Activez votre abonnement pour bénéficier de rappels et de la gestion de vos traitements.'}
            </p>
          </div>
          <div className="subscription-pricing">
            <div className="subscription-price">
              50 <span>MAD / mois</span>
            </div>
            <div className="subscription-actions">
              {subscribed ? (
                <>
                  <button
                    type="button"
                    className="med-btn med-btn--ghost med-btn--sm"
                    onClick={handleTestNotification}
                  >
                    Tester la notification
                  </button>
                  <button
                    type="button"
                    className="med-btn med-btn--danger med-btn--sm"
                    onClick={handleCancelSubscription}
                    disabled={subscribing}
                  >
                    {subscribing ? 'Annulation…' : "Annuler l'abonnement"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="med-btn med-btn--primary"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? 'Abonnement…' : "S'abonner"}
                </button>
              )}
            </div>
          </div>
        </div>

        {(error || success) && (
          <div className={`medications-alert${success ? ' medications-alert--success' : ' medications-alert--error'}`}>
            {success || error}
          </div>
        )}

        {subscribed ? (
          <>
            <div className="medication-form-card">
              <h2 className="medication-form-title">
                {editingId ? 'Modifier le médicament' : 'Ajouter un médicament'}
              </h2>
              <form className="medication-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <label>
                    Médicament
                    <input
                      name="medicine_name"
                      value={form.medicine_name}
                      onChange={handleChange}
                      placeholder="Ex. Doliprane"
                    />
                  </label>
                  <label>
                    Dosage
                    <input
                      name="dosage"
                      value={form.dosage}
                      onChange={handleChange}
                      placeholder="Ex. 1 comprimé"
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Heure de rappel
                    <input
                      type="time"
                      name="reminder_time"
                      value={form.reminder_time}
                      onChange={handleChange}
                    />
                  </label>
                  <label>
                    Notes
                    <input
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Après le repas…"
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button className="med-btn med-btn--primary" type="submit" disabled={saving}>
                    {saving
                      ? 'Enregistrement…'
                      : editingId
                        ? 'Enregistrer les modifications'
                        : 'Ajouter un médicament'}
                  </button>
                  {editingId && (
                    <button className="med-btn med-btn--outline" type="button" onClick={resetForm} disabled={saving}>
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            <section>
              <div className="medications-section-header">
                <h2 className="medications-section-title">Mes médicaments</h2>
                {!loading && (
                  <span className="medications-count">
                    {medications.length} traitement{medications.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="medications-loading">
                  <div className="medications-loading-dots">
                    <div className="medications-loading-dot" />
                    <div className="medications-loading-dot" />
                    <div className="medications-loading-dot" />
                  </div>
                  <p>Chargement des médicaments…</p>
                </div>
              ) : medications.length === 0 ? (
                <div className="medications-empty-state">
                  <img src="/notification (1).png" alt="" />
                  <h3>Aucun médicament</h3>
                  <p>Ajoutez votre premier traitement pour activer les rappels quotidiens.</p>
                </div>
              ) : (
                <div className="medications-grid">
                  {medications.map((med, index) => (
                    <article
                      key={med.id}
                      className="med-card"
                      style={{ animationDelay: `${index * 0.06}s` }}
                    >
                      <div className="med-card-stripe" />
                      <div className="med-card-head">
                        <div className="med-card-icon">{getMedicineInitials(med.medicine_name)}</div>
                        <div className="med-card-info">
                          <h3 className="med-card-name">{med.medicine_name}</h3>
                          <p className="med-card-dosage">{med.dosage}</p>
                        </div>
                      </div>
                      <div className="med-card-body">
                        <span className="med-chip">
                          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Rappel {formatReminderTime(med.reminder_time)}
                        </span>
                        {med.notes && (
                          <span className="med-chip med-chip--notes">{med.notes}</span>
                        )}
                      </div>
                      <div className="med-card-footer">
                        <button
                          type="button"
                          className="med-btn med-btn--outline med-btn--sm"
                          onClick={() => handleEdit(med)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="med-btn med-btn--danger med-btn--sm"
                          onClick={() => handleDelete(med.id)}
                          disabled={saving}
                        >
                          Supprimer
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="medications-locked">
            <img src="/notification (1).png" alt="" />
            <h3>Débloquez vos rappels</h3>
            <p>
              Abonnez-vous pour gérer vos médicaments et recevoir des notifications au moment de chaque prise.
            </p>
            <button
              type="button"
              className="med-btn med-btn--primary"
              onClick={handleSubscribe}
              disabled={subscribing}
            >
              {subscribing ? 'Abonnement…' : "S'abonner maintenant"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
