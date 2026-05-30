import React from 'react';
import PageStub from '../../components/PageStub';
import './Notifications.css';

export default function Notifications() {
  return (
    <PageStub
      image="/notification.png"
      overline="Alertes"
      title={<>Vos <span>notifications</span></>}
      lead="Restez informe de vos rendez-vous, messages et rappels."
    >
      <div className="ds-card">
        <h2 className="ds-card-title">Notifications recentes</h2>
        <p className="page-empty">Aucune notification pour le moment.</p>
      </div>
    </PageStub>
  );
}
