import React, { useState } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import PageHero from '../../components/PageHero';
import PageStepper from '../../components/PageStepper';
import './Payment.css';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!location.state) {
    return <Navigate to="/doctors" />;
  }

  const { doctor, selectedDate, selectedTime, consultationType } = location.state;
  const dateObj = new Date(selectedDate);
  const doctorName = doctor?.user?.name || doctor?.name || 'Médecin';
  const doctorPrice = doctor?.consultation_fee ?? doctor?.price ?? 300;

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const monthNames = ['Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const formattedDate = `${dayNames[dateObj.getDay()]}. ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`;

  const cancelDate = new Date(dateObj);
  const [hours, minutes] = selectedTime.split(':');
  cancelDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  cancelDate.setDate(cancelDate.getDate() - 1);
  const cancelDateFormatted = `${cancelDate.getDate()} ${monthNames[cancelDate.getMonth()]} ${cancelDate.getFullYear()} à ${cancelDate.getHours()}h${cancelDate.getMinutes() === 0 ? '00' : cancelDate.getMinutes()}`;

  const handleConfirmPayment = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        doctor_id: doctor.id,
        date: new Date(selectedDate).toISOString().slice(0, 10),
        time_slot: selectedTime,
        type: consultationType === 'video' ? 'video' : 'in-person',
        price: doctorPrice,
      };

      const response = await api.post('/appointments', payload);
      navigate('/confirm', {
        state: {
          doctor,
          selectedDate,
          selectedTime,
          consultationType,
          appointmentId: response.data?.id,
        },
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de créer le rendez-vous.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page">
      <PageHero
        image="/calendar.png"
        overline="Réservation"
        title={<>Paiement <span>sécurisé</span></>}
        lead="Finalisez votre consultation en toute confiance."
      />
      <PageStepper step={2} total={3} label="Étape 2/3 — Paiement" />

      <div className="payment-layout">
        <div>
          <h2 className="payment-section-title">Mode de paiement</h2>
          <div
            className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('card')}
            onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod('card')}
            role="button"
            tabIndex={0}
          >
            <div className="pm-icon">💳</div>
            <div>
              <div className="pm-label">Carte bancaire</div>
              <div className="pm-sub">Visa, Mastercard, CIH, Attijariwafa</div>
            </div>
            <div className={`radio-btn ${paymentMethod === 'card' ? 'checked' : ''}`} />
          </div>
          <div
            className={`payment-method ${paymentMethod === 'cmi' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('cmi')}
            onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod('cmi')}
            role="button"
            tabIndex={0}
          >
            <div className="pm-icon">📱</div>
            <div>
              <div className="pm-label">CMI / Mobile Pay</div>
              <div className="pm-sub">Paiement via application mobile</div>
            </div>
            <div className={`radio-btn ${paymentMethod === 'cmi' ? 'checked' : ''}`} />
          </div>
          <div
            className={`payment-method ${paymentMethod === 'virement' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('virement')}
            onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod('virement')}
            role="button"
            tabIndex={0}
          >
            <div className="pm-icon">🏦</div>
            <div>
              <div className="pm-label">Virement bancaire</div>
              <div className="pm-sub">Délai de confirmation : 24h</div>
            </div>
            <div className={`radio-btn ${paymentMethod === 'virement' ? 'checked' : ''}`} />
          </div>

          {paymentMethod === 'card' && (
            <div className="card-form">
              <div className="card-visual">
                <div className="card-chip" />
                <div className="card-number">4532 •••• •••• 7821</div>
                <div className="card-info">
                  <div>
                    <div className="card-label">NOM</div>
                    <div>AHMED BENALI</div>
                  </div>
                  <div>
                    <div className="card-label">EXPIRE</div>
                    <div>09/27</div>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Numéro de carte</label>
                  <input className="form-input" defaultValue="4532 7821 •••• ••••" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date d&apos;expiration</label>
                  <input className="form-input" defaultValue="09/27" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom sur la carte</label>
                  <input className="form-input" defaultValue="Ahmed Benali" />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input className="form-input" defaultValue="•••" type="password" />
                </div>
              </div>
              <p className="payment-secure">🔒 Paiement sécurisé SSL — Données chiffrées</p>
            </div>
          )}
        </div>

        <div>
          <div className="summary-card">
            <h2 className="payment-section-title">Récapitulatif</h2>
            <div className="summary-doctor">
              <div className="doc-avatar summary-avatar">{getInitials(doctorName)}</div>
              <div>
                <div className="summary-doctor-name">Dr. {doctorName}</div>
                <div className="summary-doctor-date">
                  {formattedDate} · {selectedTime.replace(':', 'h')}
                </div>
              </div>
            </div>
            <div className="summary-row">
              <span style={{ textTransform: 'capitalize' }}>Consultation {consultationType}</span>
              <span>{doctorPrice} MAD</span>
            </div>
            <div className="summary-row"><span>Frais de service</span><span>0 MAD</span></div>
            <div className="summary-row summary-row--total">
              <span>Total à payer</span>
              <span className="summary-total">{doctorPrice} MAD</span>
            </div>
            {error ? <p className="payment-error">{error}</p> : null}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px', padding: '14px' }}
              onClick={handleConfirmPayment}
              disabled={submitting}
            >
              {submitting ? 'Création du rendez-vous…' : `🔒 Payer ${doctorPrice} MAD`}
            </button>
          </div>
          <div className="payment-cancel-note">
            ✅ Annulation gratuite jusqu&apos;au <strong>{cancelDateFormatted}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
