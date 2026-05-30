import React from 'react';
import PageStub from '../../components/PageStub';

export default function Consultations() {
  return (
    <PageStub
      image="/hero3.jpeg"
      overline="Consultations"
      title={<>Vos <span>consultations</span></>}
      lead="Accedez a vos consultations video et rendez-vous en ligne."
    >
      <div className="ds-card">
        <h2 className="ds-card-title">A venir</h2>
        <p className="page-empty">Vos prochaines consultations apparaitront ici.</p>
      </div>
    </PageStub>
  );
}
