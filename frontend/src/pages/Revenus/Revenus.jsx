import React from 'react';
import PageStub from '../../components/PageStub';
import './Revenus.css';

export default function Revenus() {
  return (
    <PageStub
      image="/abonnement1.jpeg"
      overline="Finances"
      title={<>Mes <span>revenus</span></>}
      lead="Suivez vos revenus et l'historique de vos consultations."
    >
      <div className="ds-card revenus-container">
        <h2 className="ds-card-title">Resume mensuel</h2>
        <p className="page-empty">
          Votre resume des revenus sera affiche ici une fois l&apos;integration completee.
        </p>
      </div>
    </PageStub>
  );
}
