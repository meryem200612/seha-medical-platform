import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import PageHero from '../../components/PageHero';
import DoctorAvatar from '../../components/DoctorAvatar';
import './Messaging.css';

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function buildConversations(messages, userId, contacts) {
  const map = new Map();

  const ensure = (partner) => {
    if (!partner?.id) return;
    if (!map.has(partner.id)) {
      map.set(partner.id, {
        partnerId: partner.id,
        partner: partner,
        messages: [],
        lastMessage: null,
      });
    }
  };

  (contacts || []).forEach((c) => ensure(c));

  (messages || []).forEach((msg) => {
    const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
    ensure(partner);
    const conv = map.get(partner.id);
    if (!conv) return;
    conv.messages.push(msg);
    if (
      !conv.lastMessage ||
      new Date(msg.created_at) > new Date(conv.lastMessage.created_at)
    ) {
      conv.lastMessage = msg;
    }
  });

  return Array.from(map.values())
    .map((conv) => ({
      ...conv,
      messages: [...conv.messages].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      ),
    }))
    .sort((a, b) => {
      const ta = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const tb = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return tb - ta;
    });
}

export default function Messaging() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const doctorIdParam = searchParams.get('doctor_id');

  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [externalPartner, setExternalPartner] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [messagesRes, contactsRes] = await Promise.all([
        api.get('/messages'),
        api.get('/messages/contacts'),
      ]);
      const contactsData = Array.isArray(contactsRes.data) ? contactsRes.data : [];
      
      // Fetch doctor profiles for contacts to get profile pictures
      const contactsWithProfiles = await Promise.all(
        contactsData.map(async (contact) => {
          if (contact.role === 'doctor') {
            try {
              const docRes = await api.get(`/doctors/${contact.id}`);
              return { ...contact, ...docRes.data };
            } catch (e) {
              console.error(`Failed to fetch profile for doctor ${contact.id}:`, e);
              return contact;
            }
          }
          return contact;
        })
      );
      
      setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
      setContacts(contactsWithProfiles);
      setError('');
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.response?.data?.message || 'Impossible de charger les messages.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadData();
    }
  }, [user, loadData]);

  useEffect(() => {
    if (!user || !doctorIdParam) return;

    const id = Number(doctorIdParam);
    if (!id) return;

    const fromContacts = contacts.find((c) => c.id === id);
    if (fromContacts) {
      setSelectedPartnerId(id);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/doctors/${id}`);
        if (cancelled) return;
        const doc = res.data;
        const partner = {
          id: doc.id || doc.user?.id,
          name: doc.name || doc.user?.name || 'Médecin',
          role: 'doctor',
        };
        if (partner.id) {
          setExternalPartner(partner);
          setSelectedPartnerId(partner.id);
        }
      } catch (e) {
        console.error('Could not load doctor for messaging:', e);
      }
    })();

    return () => { cancelled = true; };
  }, [doctorIdParam, contacts, user]);

  useEffect(() => {
    if (!user) return undefined;
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [user, loadData]);

  const conversations = useMemo(() => {
    const allContacts = [...contacts];
    if (
      externalPartner &&
      !allContacts.some((c) => c.id === externalPartner.id)
    ) {
      allContacts.push(externalPartner);
    }
    return buildConversations(messages, user?.id, allContacts);
  }, [messages, contacts, externalPartner, user?.id]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.partner?.name || '').toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.partnerId === selectedPartnerId),
    [conversations, selectedPartnerId]
  );

  const selectConversation = (partnerId) => {
    setSelectedPartnerId(partnerId);
    setSendError('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('doctor_id');
      return next;
    }, { replace: true });
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !selectedPartnerId || sending) return;

    setSending(true);
    setSendError('');
    try {
      const res = await api.post('/messages', {
        receiver_id: selectedPartnerId,
        content: text,
      });
      setMessages((prev) => [...prev, res.data]);
      setDraft('');
    } catch (err) {
      setSendError(
        err.response?.data?.message || 'Impossible d\'envoyer le message.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!user) {
    return (
      <div className="app-page">
        <PageHero
          image="/notification.png"
          overline="Messagerie"
          title={<>Vos <span>messages</span></>}
          lead="Connectez-vous pour accéder à vos conversations."
        />
        <div className="app-page-body">
          <div className="msg-gate">
            <p>Veuillez vous connecter pour voir vos messages.</p>
            <Link to="/auth" className="btn btn-primary">Se connecter</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-page">
        <PageHero
          image="/teal.jpeg"
          overline="Messagerie"
          title={<>Vos <span>messages</span></>}
          lead="Chargement de vos conversations…"
        />
        <div className="app-page-body msg-loading">Chargement…</div>
      </div>
    );
  }

  const partner = activeConversation?.partner;
  const threadMessages = activeConversation?.messages ?? [];

  return (
    <div className="app-page">
      <PageHero
        image="/teal.jpeg"
        overline="Messagerie"
        title={<>Vos <span>messages</span></>}
        lead="Échangez avec vos médecins et patients en toute confidentialité."
      />
      <div className="app-page-body">
        {error ? (
          <div className="msg-error-banner">{error}</div>
        ) : null}

        <div className="msg-layout">
          <aside className="msg-sidebar">
            <div className="msg-sidebar-title">Conversations</div>
            <div className="msg-search">
              <input
                type="search"
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="msg-list">
              {filteredConversations.length === 0 ? (
                <div className="msg-list-empty">
                  {user.role === 'patient' ? (
                    <>
                      <p>Aucune conversation.</p>
                      <Link to="/doctors" className="msg-list-empty-link">
                        Trouver un médecin →
                      </Link>
                    </>
                  ) : (
                    <p>Aucun patient avec rendez-vous pour le moment.</p>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    type="button"
                    className={`msg-item${selectedPartnerId === conv.partnerId ? ' active' : ''}`}
                    onClick={() => selectConversation(conv.partnerId)}
                  >
                    <div className="msg-item-avatar">
                      <DoctorAvatar doctor={conv.partner} name={conv.partner?.name} size="md" />
                    </div>
                    <div className="msg-item-info">
                      <div className="msg-item-name">{conv.partner?.name}</div>
                      <div className="msg-item-preview">
                        {conv.lastMessage
                          ? conv.lastMessage.content
                          : 'Nouvelle conversation'}
                      </div>
                    </div>
                    {conv.lastMessage ? (
                      <div className="msg-item-meta">
                        <div className="msg-time">
                          {formatTime(conv.lastMessage.created_at)}
                        </div>
                      </div>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="msg-main">
            {partner ? (
              <>
                <header className="msg-header">
                  <div className="msg-header-avatar">
                    <DoctorAvatar doctor={partner} name={partner.name} size="md" />
                  </div>
                  <div>
                    <div className="msg-header-name">{partner.name}</div>
                    <div className="msg-header-status">
                      {partner.role === 'doctor' ? 'Médecin' : 'Patient'}
                    </div>
                  </div>
                  <div className="msg-header-actions">
                    {user.role === 'patient' && partner.role === 'doctor' && (
                      <>
                        <Link
                          to="/video"
                          state={{
                            doctor: {
                              id: partner.id,
                              name: partner.name,
                              user: { id: partner.id, name: partner.name },
                            },
                          }}
                        >
                          <button type="button" className="btn btn-primary btn-sm">
                            Appel vidéo
                          </button>
                        </Link>
                        <Link to={`/booking/${partner.id}`}>
                          <button type="button" className="btn btn-outline btn-sm">
                            Prendre RDV
                          </button>
                        </Link>
                      </>
                    )}
                    {user.role === 'doctor' && partner.role === 'patient' && (
                      <Link
                        to="/video"
                        state={{ patientId: partner.id, patientName: partner.name }}
                      >
                        <button type="button" className="btn btn-primary btn-sm">
                          Appel vidéo
                        </button>
                      </Link>
                    )}
                  </div>
                </header>

                <div className="msg-body">
                  {threadMessages.length === 0 ? (
                    <div className="msg-thread-empty">
                      Aucun message pour l&apos;instant. Envoyez le premier message.
                    </div>
                  ) : (
                    threadMessages.map((msg) => {
                      const isMe = msg.sender_id === user.id;
                      return (
                          <div
                          key={msg.id}
                          className={`msg-bubble-wrap${isMe ? ' me' : ''}`}
                        >
                          {!isMe ? (
                            <div className="msg-bubble-avatar">
                              <DoctorAvatar doctor={partner} name={partner.name} size="sm" />
                            </div>
                          ) : null}
                          <div>
                            <div className={`msg-bubble${isMe ? ' me' : ' them'}`}>
                              {msg.content}
                            </div>
                            <div className={`msg-bubble-time${isMe ? ' me' : ''}`}>
                              {formatTime(msg.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form className="msg-footer" onSubmit={handleSend}>
                  <input
                    type="text"
                    placeholder="Écrivez un message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="msg-footer-btn"
                    disabled={sending || !draft.trim()}
                    aria-label="Envoyer"
                  >
                    {sending ? '…' : '↑'}
                  </button>
                </form>
                {sendError ? <p className="msg-send-error">{sendError}</p> : null}
              </>
            ) : (
              <>
                <header className="msg-header">
                  <div className="msg-header-avatar msg-header-avatar--placeholder">?</div>
                  <div>
                    <div className="msg-header-name">Sélectionnez une conversation</div>
                    <div className="msg-header-status msg-header-status--muted">
                      Choisissez un contact à gauche
                    </div>
                  </div>
                </header>
                <div className="msg-body msg-body--empty">
                  <p>Sélectionnez une conversation pour afficher les messages.</p>
                </div>
                <div className="msg-footer msg-footer--disabled">
                  <input placeholder="Écrivez un message…" disabled />
                  <button type="button" className="msg-footer-btn" disabled>
                    ↑
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
