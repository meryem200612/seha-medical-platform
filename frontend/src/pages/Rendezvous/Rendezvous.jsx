import React from 'react';
import PageStub from '../../components/PageStub';

export default function Rendezvous() {
  return (
    <PageStub
      image="/calendar.png"
      overline="Agenda"
      title={<>Mes <span>rendez-vous</span></>}
      lead="Consultez et gerez tous vos rendez-vous."
    >
      <div className="ds-card">
        <h2 className="ds-card-title">Rendez-vous a venir</h2>
        <p className="page-empty">Vos prochains rendez-vous apparaitront ici.</p>
      </div>
    </PageStub>
  );
}
