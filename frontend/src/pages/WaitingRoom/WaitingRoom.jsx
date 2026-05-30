import React, { useState, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import PageHero from '../../components/PageHero';
import DoctorAvatar from '../../components/DoctorAvatar';
import './WaitingRoom.css';

export default function WaitingRoom() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!location.state) {
    return <Navigate to="/doctors" />;
  }

  const { doctor, selectedDate, selectedTime, consultationType } = location.state;

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formattedTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
  const doctorName = doctor.user?.name || doctor.name || 'Medecin';

  return (
    <div className="app-page">
      <PageHero
        image="/hero3.jpeg"
        overline="Salle d'attente"
        title={<>En attente du <span>medecin</span></>}
        lead="Votre consultation va commencer dans quelques instants."
      />
      <div className="waiting-screen">
        <div className="waiting-avatar">
          <div className="waiting-pulse" />
          <DoctorAvatar doctor={doctor} name={doctorName} size="xl" />
        </div>
        <div className="waiting-doctor-name">Dr. {doctorName}</div>
        <div className="waiting-doctor-meta">
          {doctor.specialty?.name ?? 'Medecin'} · Consultation video
        </div>
        <div className="waiting-clock">{formattedTime}</div>
        <p className="waiting-hint">
          Votre rendez-vous commence dans <strong>quelques instants</strong>
        </p>
        <div className="waiting-dots">
          <div className="waiting-dot" />
          <div className="waiting-dot" />
          <div className="waiting-dot" />
        </div>
        <p className="waiting-status">Le medecin se prepare...</p>
        <div className="ds-card waiting-check-card">
          <div className="ds-card-title">Verification pre-consultation</div>
          <ul className="waiting-checklist">
            <li className="waiting-check--ok">Connexion internet stable</li>
            <li className="waiting-check--ok">Camera detectee et fonctionnelle</li>
            <li className="waiting-check--ok">Microphone actif</li>
            <li className="waiting-check--warn">Fond sonore detecte — utilisez des ecouteurs</li>
          </ul>
        </div>
        <div className="confirm-actions">
          <Link to="/video" state={{ doctor, selectedDate, selectedTime, consultationType }}>
            <button type="button" className="btn btn-primary btn-lg">
              Rejoindre maintenant
            </button>
          </Link>
          <Link to="/">
            <button type="button" className="btn btn-outline btn-lg">
              Annuler
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
