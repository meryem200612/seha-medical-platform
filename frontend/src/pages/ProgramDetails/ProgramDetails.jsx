import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import PageStub from '../../components/PageStub';
import './ProgramDetails.css';

export default function ProgramDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [buying, setBuying] = useState(false);

  const benefits = program?.content
    ? program.content.split(/\n|\r\n/).map((line) => line.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await api.get(`/programs/${id}`);
        setProgram(response.data);
      } catch (fetchError) {
        console.error('Erreur de chargement du programme :', fetchError);
        setError(fetchError.response?.data?.message || 'Impossible de charger le programme.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [id]);

  const handleBuy = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setBuying(true);
    setMessage(null);

    try {
      const response = await api.post(`/programs/${id}/buy`);
      setMessage('Achat reussi. Votre paiement a ete enregistre.');
      setProgram((prevProgram) => ({ ...prevProgram, purchased: true }));
      console.log('Achat programme reussi', response.data);
    } catch (purchaseError) {
      console.error('Erreur lors de l achat du programme :', purchaseError);
      setMessage(purchaseError.response?.data?.message || 'Impossible d acheter le programme.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <PageStub
      image="/programme.png"
      overline="Programmes"
      title={<>Detail du <span>programme</span></>}
      lead="Consultez les informations completes et achetez le programme si vous en avez besoin."
    >
      <div className="program-details-page">
        {loading ? (
          <p>Chargement du programme...</p>
        ) : error ? (
          <div className="program-details-error">
            <p>{error}</p>
          </div>
        ) : program ? (
          <div className="program-details-card">
            {program.image_url && (
              <div className="program-details-image">
                <img src={program.image_url} alt={program.title} />
              </div>
            )}
            <div className="program-details-meta">
              <h2>{program.title}</h2>
              <p className="program-details-category">{program.category || 'Programme'} </p>
              <p className="program-details-description">{program.description}</p>
              <div className="program-details-info">
                <p><strong>Prix :</strong> {program.price} MAD</p>
                <p><strong>Durée :</strong> {program.duration_weeks} semaines</p>
                <p><strong>Médecin :</strong> {program.doctor?.name || 'Inconnu'}</p>
                {program.doctor?.specialty && (
                  <p><strong>Specialite :</strong> {program.doctor.specialty}</p>
                )}
              </div>
              {benefits.length > 0 && (
                <div className="program-details-benefits">
                  <h3>Bénéfices</h3>
                  <ul>
                    {benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
              {program.content && (
                <div className="program-details-content">
                  <h3>Contenu du programme</h3>
                  <p>{program.content}</p>
                </div>
              )}
              {message && <div className="program-details-message">{message}</div>}
              {user?.role === 'patient' && !program.purchased && (
                <button
                  type="button"
                  className="prog-btn prog-btn--primary"
                  onClick={handleBuy}
                  disabled={buying}
                >
                  {buying ? 'Achat en cours...' : `Acheter pour ${program.price} MAD`}
                </button>
              )}
              {user?.role === 'doctor' && (
                <p className="program-details-note">Vous consultez ce programme en tant que médecin.</p>
              )}
            </div>
          </div>
        ) : (
          <p>Programme introuvable.</p>
        )}
      </div>
    </PageStub>
  );
}
