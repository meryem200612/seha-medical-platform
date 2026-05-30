import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHero from '../../components/PageHero';
import './Availability.css';

export default function Availability() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState({
    monday: { enabled: true, slots: ['09:00', '10:00', '14:00', '15:00'] },
    tuesday: { enabled: true, slots: ['09:00', '10:00', '14:00', '15:00'] },
    wednesday: { enabled: true, slots: ['09:00', '10:00', '14:00', '15:00'] },
    thursday: { enabled: true, slots: ['09:00', '10:00', '14:00', '15:00'] },
    friday: { enabled: true, slots: ['09:00', '10:00', '14:00', '15:00'] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
  });

  const days = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' },
  ];

  const handleDayToggle = (dayKey) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled
      }
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    alert('Disponibilité sauvegardée ! (Fonctionnalité à implémenter)');
  };

  if (!user) {
    return (
      <div className="app-page">
        <h2>Veuillez vous connecter pour gérer votre disponibilité.</h2>
      </div>
    );
  }

  return (
    <div className="app-page">
      <PageHero
        image="/calendar.png"
        overline="Planning"
        title={<>Ma <span>disponibilite</span></>}
        lead="Definissez vos horaires de consultation pour chaque jour de la semaine."
      />
      <div className="app-page-body availability-container">
        <div className="availability-content">
          <div className="days-grid">
            {days.map((day) => (
              <div key={day.key} className="day-card">
                <div className="day-header">
                  <span className="day-label">{day.label}</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={availability[day.key].enabled}
                      onChange={() => handleDayToggle(day.key)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {availability[day.key].enabled && (
                  <div className="day-slots">
                    <div className="slots-title">Créneaux disponibles :</div>
                    <div className="slots-list">
                      {availability[day.key].slots.map((slot, index) => (
                        <span key={index} className="time-slot">{slot}</span>
                      ))}
                    </div>
                    <button className="btn btn-outline btn-sm" style={{ marginTop: '8px' }}>
                      Modifier les créneaux
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="availability-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Sauvegarder les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}