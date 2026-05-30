import React from 'react';
import PageStub from '../../components/PageStub';

export default function Patients() {
  return (
    <PageStub
      image="/people.png"
      overline="Espace medecin"
      title={<>Mes <span>patients</span></>}
      lead="Consultez et gerez la liste de vos patients."
    >
      <div className="ds-card">
        <h2 className="ds-card-title">Liste des patients</h2>
        <p className="page-empty">Aucun patient pour le moment.</p>
      </div>
    </PageStub>
  );
}
