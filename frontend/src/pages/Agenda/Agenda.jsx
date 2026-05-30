import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import PageHero from '../../components/PageHero';
import './Agenda.css';

export default function Agenda() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      try {
        // For now, we'll use the dashboard endpoint to get appointments
        // In a real app, you'd have a dedicated appointments endpoint
        const response = await api.get('/doctor/dashboard');
        setAppointments(response.data.upcoming_appointments || []);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Impossible de charger vos rendez-vous.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  if (!user) {
    return (
      <div className="app-page">
        <h2>Veuillez vous connecter pour voir votre agenda.</h2>
      </div>
    );
  }

  return (
    <div className="app-page">
      <PageHero
        image="/calendar.png"
        overline="Planning"
        title={<>Mon <span>agenda</span></>}
        lead="Gerez vos rendez-vous et consultez votre planning."
      />
      <div className="app-page-body agenda-container">

        {error && (
          <div className="agenda-error">
            {error}
          </div>
        )}

        <div className="agenda-content">
          {loading ? (
            <div className="agenda-loading">Chargement de votre agenda...</div>
          ) : appointments.length === 0 ? (
            <div className="agenda-empty">
              <h3>Aucun rendez-vous prévu</h3>
              <p>Vos prochains rendez-vous apparaîtront ici.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="appointment-card">
                  <div className="appointment-info">
                    <div className="appointment-patient">
                      <strong>{appointment.patient_name || 'Patient'}</strong>
                    </div>
                    <div className="appointment-details">
                      <span className="appointment-date">{appointment.date}</span>
                      <span className="appointment-time">{appointment.time_slot}</span>
                      <span className={`appointment-type ${appointment.type}`}>
                        {appointment.type === 'video' ? '📹 Vidéo' : '🏥 Cabinet'}
                      </span>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <span className={`status-badge status-${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}