import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import PageHero from '../../components/PageHero';
import PageStepper from '../../components/PageStepper';
import './Booking.css';

export default function Booking() {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTime = queryParams.get('time');

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(initialTime || '');
  const [consultationType, setConsultationType] = useState('video');
  const [motive, setMotive] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await api.get(`/doctors/${id}`);
        setDoctor(response.data);
      } catch (error) {
        console.error("Error fetching doctor:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDoctor();
  }, [id]);

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getDaysArray = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday as first day

    const days = [];
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isSameDay = (d1, d2) => {
    return d1 && d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  const isPastDay = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const generateTimeSlots = () => {
    // Generate some random taken slots for realism based on the day
    const seed = selectedDate ? selectedDate.getDate() : 1;
    const slots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ];
    return slots.map((time, i) => ({
      time,
      taken: (seed * i) % 5 === 0 // pseudo-random taken logic
    }));
  };

  const timeSlots = generateTimeSlots();

  if (loading) {
    return <div className="app-page">Chargement...</div>;
  }

  if (!doctor) {
    return <div className="app-page">Médecin introuvable.</div>;
  }

  return (
    <div className="app-page">
      <PageHero
        image="/calendar.png"
        overline="Reservation"
        title={<>Choisir un <span>creneau</span></>}
        lead={`Reservez votre consultation avec Dr. ${doctor.user?.name || 'votre medecin'}.`}
      />
      <PageStepper step={1} total={3} label="Etape 1/3 — Choisir un creneau" />
      <div className="booking-layout">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'var(--blue-light)', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
            <div className="doc-avatar" style={{ background: doctor.user?.gender === 'F' ? 'linear-gradient(135deg,#FF6B6B,#EE5253)' : 'linear-gradient(135deg,#2A7FFF,#1A5FCC)', width: '48px', height: '48px', fontSize: '18px' }}>
              {getInitials(doctor.user?.name)}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>Dr. {doctor.user?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--blue)' }}>{doctor.specialty?.name ?? 'Médecin'} · {doctor.consultation_fee || 300} MAD · 30 min</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button 
              className={`btn btn-sm ${consultationType === 'video' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setConsultationType('video')}
            >📹 Vidéo</button>
            <button 
              className={`btn btn-sm ${consultationType === 'cabinet' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setConsultationType('cabinet')}
            >🏥 Cabinet</button>
            <button 
              className={`btn btn-sm ${consultationType === 'domicile' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setConsultationType('domicile')}
            >🏠 Domicile</button>
          </div>
          <div className="calendar-wrapper">
            <div className="cal-header">
              <div className="cal-nav" onClick={prevMonth}>‹</div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
              <div className="cal-nav" onClick={nextMonth}>›</div>
            </div>
            <div className="cal-grid">
              <div className="cal-day-name">Lun</div><div className="cal-day-name">Mar</div><div className="cal-day-name">Mer</div><div className="cal-day-name">Jeu</div><div className="cal-day-name">Ven</div><div className="cal-day-name">Sam</div><div className="cal-day-name">Dim</div>
              {getDaysArray().map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="cal-day" style={{ visibility: 'hidden' }}></div>;
                
                const isPast = isPastDay(date);
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                
                let className = "cal-day";
                if (isPast) className += " disabled";
                else if (isSelected) className += " selected";
                else if (isToday) className += " today";

                return (
                  <div 
                    key={date.toString()} 
                    className={className}
                    onClick={() => !isPast && setSelectedDate(date)}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
                Créneaux disponibles — {selectedDate ? `${dayNames[selectedDate.getDay()]} ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}` : ''}
              </div>
              <div className="time-slots">
                {timeSlots.map((slot, idx) => (
                  <div 
                    key={idx} 
                    className={`time-slot ${slot.taken ? 'taken' : ''} ${selectedTime === slot.time ? 'selected' : ''}`}
                    onClick={() => !slot.taken && setSelectedTime(slot.time)}
                  >
                    {slot.time.replace(':', 'h')}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="calendar-wrapper">
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Motif de consultation</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {["Douleurs thoraciques", "Palpitations", "Suivi traitement", "Résultats analyses", "Autre"].map(m => (
                <button 
                  key={m} 
                  className={`btn btn-sm ${motive === m ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setMotive(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea className="form-input" rows="3" placeholder="Décrivez vos symptômes ou votre question..."></textarea>
          </div>
        </div>
        <div>
          <div className="summary-card">
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Récapitulatif</div>
            <div className="summary-row"><span>Médecin</span><span style={{ fontWeight: '600' }}>Dr. {doctor.user?.name}</span></div>
            <div className="summary-row"><span>Spécialité</span><span>{doctor.specialty?.name ?? 'Médecin'}</span></div>
            <div className="summary-row">
              <span>Type</span>
              <span style={{ textTransform: 'capitalize' }}>
                {consultationType === 'video' ? 'Consultation vidéo' : consultationType === 'cabinet' ? 'En cabinet' : 'À domicile'}
              </span>
            </div>
            <div className="summary-row">
              <span>Date</span>
              <span>{selectedDate ? `${dayNames[selectedDate.getDay()]} ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` : '-'}</span>
            </div>
            <div className="summary-row">
              <span>Heure</span>
              <span style={{ fontWeight: '600', color: selectedTime ? 'var(--blue)' : 'var(--text-3)' }}>
                {selectedTime ? `${selectedTime.replace(':', 'h')} – ${parseInt(selectedTime.split(':')[0]) + Math.floor((parseInt(selectedTime.split(':')[1]) + 30) / 60)}h${(parseInt(selectedTime.split(':')[1]) + 30) % 60 === 0 ? '00' : '30'}` : 'À sélectionner'}
              </span>
            </div>
            <div className="summary-row"><span>Durée</span><span>30 minutes</span></div>
            <div className="summary-row" style={{ borderTop: '2px solid var(--gray-3)', paddingTop: '14px', marginTop: '4px' }}><span>Total</span><span style={{ color: 'var(--blue)' }}>{doctor.consultation_fee || 300} MAD</span></div>
            
            {selectedDate && selectedTime ? (
              <Link to="/payment" state={{ doctor, selectedDate: selectedDate.toISOString(), selectedTime, consultationType }}>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>Confirmer le créneau →</button>
              </Link>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px', opacity: 0.5, cursor: 'not-allowed' }} disabled>
                Sélectionnez une date et heure
              </button>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', marginTop: '10px' }}>🔒 Annulation gratuite 24h avant</div>
          </div>
        </div>
      </div>
    </div>
  );
}