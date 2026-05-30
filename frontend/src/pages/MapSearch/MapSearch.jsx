import React from 'react';
import PageStub from '../../components/PageStub';

export default function MapSearch() {
  return (
    <PageStub
      image="/hero5.jpeg"
      overline="Localisation"
      title={<>Trouver un <span>medecin</span></>}
      lead="Recherchez des medecins pres de chez vous sur la carte."
    >
      <div className="ds-card">
        <h2 className="ds-card-title">Carte interactive</h2>
        <p className="page-empty">La recherche par carte sera disponible prochainement.</p>
      </div>
    </PageStub>
  );
}
