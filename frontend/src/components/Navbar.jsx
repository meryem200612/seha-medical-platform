import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="navbar">
      <Link to="/" className="logo" > 
        <div className="logo-icon">
         <img src="logoseha.png" alt="Logo" style={{ width: '80px', height: '80px' }} />
        </div>
      </Link>
      <div className="nav-links">
        <Link to="/">Accueil</Link>
        <Link to="/doctors">Médecins</Link>
        <Link to="/programs">Programmes</Link>
        {user?.role === 'patient' && <Link to="/medications">Abonnement</Link>}
        {user?.role === 'doctor' && <Link to="/dashboard">Tableau de bord</Link>}
        {user?.role === 'patient' && <Link to="/patient">Mon Profil</Link>}
      </div>
      <div className="nav-actions">
       {user ? (
  <div className="nav-user-wrap">
    <span className="nav-user-greeting">
      {user.role === 'doctor' 
        ? `Bonjour Dr ${user.name}` 
        : `Bonjour, ${user.name}`}
    </span>
    <button onClick={handleLogout} className="btn btn-outline btn-sm">
      Déconnexion
    </button>
  </div>
) : (
  <>
    <Link to="/auth">
      <button className="btn btn-outline">Connexion</button>
    </Link>
    <Link to="/auth">
      <button className="btn btn-primary">S'inscrire</button>
    </Link>
  </>
)}
      </div>
    </div>
  );
}
