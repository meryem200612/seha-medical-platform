import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import PageHero from '../../components/PageHero';
import PageStepper from '../../components/PageStepper';
import './Confirmation.css';

export default function Confirmation() {
  const location = useLocation();

  if (!location.state) {
    return <Navigate to="/doctors" />;
  }

  const { doctor, selectedDate, selectedTime, consultationType } = location.state;
  const dateObj = new Date(selectedDate);

  const monthNames = ['Jan.', 'Fev.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Aout', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const formattedDate = `${dayNames[dateObj.getDay()]}. ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  const bookingNumber = `#SH-${dateObj.getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`;
  const doctorName = doctor.user?.name || doctor.name || 'Medecin';

  return (
    <div className="app-page">
      <PageHero
        image="/hero5.jpeg"
        overline="Reservation confirmee"
        title={<>Rendez-vous <span>confirme</span></>}
        lead="Votre consultation est enregistree. Un email de confirmation vous a ete envoye."
      />
      <PageStepper step={3} total={3} label="Etape 3/3 — Confirmation" />

      <div className="confirm-screen">
        <div className="confirm-icon">✅</div>
        <div className="confirm-title">Rendez-vous confirme !</div>
        <p className="confirm-sub">
          Votre consultation avec <strong>Dr. {doctorName}</strong> est bien enregistree.
        </p>
        <div className="confirm-card">
          <h3 className="confirm-card-heading">Details du rendez-vous</h3>
          <div className="confirm-row"><span>Médecin</span><strong>Dr. {doctorName}</strong></div>
          <div className="confirm-row"><span>Specialite</span><span>{doctor.specialty?.name ?? 'Medecin'}</span></div>
          <div className="confirm-row"><span>Date et heure</span><strong>{formattedDate} · {selectedTime.replace(':', 'h')}</strong></div>
          <div className="confirm-row">
            <span>Type</span>
            <span>
              {consultationType === 'video' ? 'Consultation video' : consultationType === 'cabinet' ? 'En cabinet' : 'A domicile'}
            </span>
          </div>
          <div className="confirm-row"><span>Montant paye</span><strong>{doctor.consultation_fee || 300} MAD</strong></div>
          <div className="confirm-row"><span>N° reservation</span><span className="confirm-ref">{bookingNumber}</span></div>
        </div>
        <div className="confirm-tip">
          <strong>A savoir avant votre consultation :</strong>
          <ul>
            <li>La salle d&apos;attente virtuelle s&apos;ouvre 5 min avant le rendez-vous</li>
            <li>Assurez-vous d&apos;avoir une connexion internet stable</li>
            <li>Munissez-vous de vos dernieres analyses et ordonnances</li>
          </ul>
        </div>
        <div className="confirm-actions">
          <Link to="/waiting" state={{ doctor, selectedDate, selectedTime, consultationType }}>
            <button type="button" className="btn btn-primary btn-lg">Aller a la salle d&apos;attente</button>
          </Link>
          <Link to="/messages">
            <button type="button" className="btn btn-outline btn-lg">Contacter le medecin</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
