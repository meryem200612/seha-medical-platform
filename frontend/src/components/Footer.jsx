import React from 'react';
import { Link } from 'react-router-dom';


export default function Footer() {
  return (
    <footer className="footer">
      {/* Top wave divider */}
      <div className="footer-wave">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#0f2e2e"/>
        </svg>
      </div>

      <div className="footer-body">
        <div className="footer-grid">

          {/* Brand column */}
          <div className="footer-brand">
            <img src="logoseha.png" alt="Seha" className="footer-logo" />
            <p className="footer-tagline">
              seha, accessible partout au Maroc. Des médecins certifiés, disponibles 7j/7.
            </p>
            <div className="footer-socials">
              {/* Facebook */}
              <a href="https://www.facebook.com" className="footer-social" aria-label="Facebook" target="_blank"
  rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com" className="footer-social" aria-label="Instagram" target="_blank"
  rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="https://www.linkedin.com" className="footer-social" aria-label="LinkedIn" target="_blank"
  rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links">
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/doctors">Trouver un médecin</Link></li>
              <li><Link to="/appointments">Mes rendez-vous</Link></li>
              <li><Link to="/messages">Messagerie</Link></li>
            </ul>
          </div>

          {/* Specialties */}
          <div className="footer-col">
            <h4 className="footer-col-title">Spécialités</h4>
            <ul className="footer-links">
              <li><Link to="/doctors?specialty=cardiologue">Cardiologie</Link></li>
              <li><Link to="/doctors?specialty=pediatre">Pédiatrie</Link></li>
              <li><Link to="/doctors?specialty=dermatologue">Dermatologie</Link></li>
              <li><Link to="/doctors?specialty=neurologue">Neurologie</Link></li>
              <li><Link to="/doctors?specialty=ophtalmologue">Ophtalmologie</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-col-title">Contact</h4>
            <ul className="footer-links footer-links--contact">
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <span>support@seha.ma</span>
              </li>
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                <span>+212 500000000</span>
              </li>
              <li>
                <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <span>Casablanca, Maroc</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-copy">© {new Date().getFullYear()} Seha. Tous droits réservés.</p>
          <div className="footer-legal">
            <a href="https://www.seha.ma/politique-de-confidentialite" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a>
            <span className="footer-dot" />
            <a href="https://www.seha.ma/conditions-d-utilisation" target="_blank" rel="noopener noreferrer">Conditions d'utilisation</a>
            <span className="footer-dot" />
            <a href="https://www.seha.ma/mentions-legales" target="_blank" rel="noopener noreferrer">Mentions légales</a>
          </div>
        </div>
      </div>
    </footer>
  );
}