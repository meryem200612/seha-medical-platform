import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Peer from 'peerjs';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DoctorAvatar from '../../components/DoctorAvatar';
import './VideoCall.css';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const STATUS_LABELS = {
  idle: 'Préparation…',
  waiting: 'En attente du patient…',
  connecting: 'Connexion en cours…',
  connected: 'Connecté',
  error: 'Connexion impossible',
  offline: 'Le médecin n\'est pas en ligne',
};

export default function VideoCall() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [timer, setTimer] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [callStatus, setCallStatus] = useState('idle');
  const [statusDetail, setStatusDetail] = useState('');
  const [sessionMeta, setSessionMeta] = useState(null);
  const [chatDraft, setChatDraft] = useState('');
  const [chatMessages, setChatMessages] = useState([
  ]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const activeCallRef = useRef(null);
  const dataConnRef = useRef(null);
  const callConnectedRef = useRef(false);
  const streamRef = useRef(null);

  const locationDoctor = location.state?.doctor;
  const doctorUserId =
    locationDoctor?.user?.id ??
    locationDoctor?.id ??
    location.state?.doctorId ??
    null;

  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  const displayDoctor = locationDoctor || (sessionMeta ? {
    id: sessionMeta.doctor_id,
    name: sessionMeta.doctor_name,
    user: { id: sessionMeta.doctor_id, name: sessionMeta.doctor_name },
    photo_url: sessionMeta.doctor_photo_url,
    specialty: { name: 'Médecin' },
  } : null);

  const attachStream = useCallback((videoEl, stream) => {
    if (videoEl && stream) {
      videoEl.srcObject = stream;
    }
  }, []);

  const receiveChatMessage = useCallback((payload) => {
    if (!payload || payload.type !== 'chat' || !payload.text) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: payload.id || `${Date.now()}-remote`,
        from: 'them',
        text: payload.text,
      },
    ]);
  }, []);

  const setupDataConnection = useCallback((conn) => {
    if (!conn) return;

    dataConnRef.current?.close();
    dataConnRef.current = conn;

    conn.on('data', receiveChatMessage);
    conn.on('close', () => {
      if (dataConnRef.current === conn) {
        dataConnRef.current = null;
      }
    });
    conn.on('error', (err) => {
      console.error('Peer chat error:', err);
      if (dataConnRef.current === conn) {
        dataConnRef.current = null;
      }
    });
  }, [receiveChatMessage]);

  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const startMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = mediaStream;
        setLocalStream(mediaStream);
        attachStream(localVideoRef.current, mediaStream);
      } catch (err) {
        console.error('Media error:', err);
        setIsCameraOn(false);
        setIsMicOn(false);
        setCallStatus('error');
        setStatusDetail('Caméra ou micro inaccessible.');
      }
    };

    if (user) startMedia();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      activeCallRef.current?.close();
      dataConnRef.current?.close();
      peerRef.current?.destroy();
    };
  }, [user, attachStream]);

  useEffect(() => {
    if (localStream) {
      attachStream(localVideoRef.current, localStream);
    }
  }, [localStream, attachStream]);

  useEffect(() => {
    if (remoteStream) {
      attachStream(remoteVideoRef.current, remoteStream);
    }
  }, [remoteStream, attachStream]);

  useEffect(() => {
    if (!user || !localStream) return undefined;

    let peer;
    let retryTimer;

    const setupPeer = async () => {
      try {
        let meta = sessionMeta;
        if (!meta) {
          const payload = isDoctor
            ? { doctor_id: user.id, patient_id: location.state?.patientId ?? null }
            : { doctor_id: doctorUserId };

          if (!payload.doctor_id) {
            setCallStatus('error');
            setStatusDetail('Médecin non spécifié.');
            return;
          }

          const res = await api.post('/video/join', payload);
          meta = res.data;
          setSessionMeta(meta);
        }

        if (isDoctor) {
          setCallStatus('waiting');
          setStatusDetail(
            meta.mode === 'lobby'
              ? 'Le patient peut vous appeler depuis la salle d\'attente.'
              : 'Salle vidéo ouverte — en attente de l\'appel du patient.'
          );

          peer = new Peer(meta.peer_id, { debug: 1 });

          peer.on('open', () => {
            setStatusDetail('Salle vidéo ouverte — en attente d\'un appel.');
          });

          peer.on('call', (call) => {
            activeCallRef.current = call;
            callConnectedRef.current = false;
            setCallStatus('connecting');
            call.answer(localStream);
            call.on('stream', (remote) => {
              callConnectedRef.current = true;
              setRemoteStream(remote);
              setCallStatus('connected');
              setStatusDetail('');
            });
            call.on('close', () => {
              callConnectedRef.current = false;
              activeCallRef.current = null;
              setRemoteStream(null);
              setCallStatus('waiting');
            });
            call.on('error', () => {
              callConnectedRef.current = false;
              activeCallRef.current = null;
              setCallStatus('error');
              setStatusDetail('Erreur pendant l\'appel.');
            });
          });

          peer.on('connection', setupDataConnection);

          peer.on('error', (err) => {
            console.error('Peer error (doctor):', err);
            setCallStatus('error');
            setStatusDetail('Impossible d\'ouvrir la salle vidéo.');
          });
        } else if (isPatient) {
          setCallStatus('connecting');
          const targetId = meta.target_peer_id || `seha-doctor-${meta.doctor_id}`;

          peer = new Peer({ debug: 1 });

          peer.on('open', () => {
            const openChat = () => {
              if (dataConnRef.current?.open) return;
              const conn = peer.connect(targetId, { reliable: true });
              setupDataConnection(conn);
            };

            const attemptCall = () => {
              if (callConnectedRef.current || activeCallRef.current?.open) return;

              try {
                openChat();
                const call = peer.call(targetId, localStream);
                activeCallRef.current = call;
                callConnectedRef.current = false;

                setTimeout(() => {
                  if (!callConnectedRef.current && activeCallRef.current === call) {
                    call.close();
                    activeCallRef.current = null;
                    setCallStatus('offline');
                    setStatusDetail('Le médecin n\'est pas encore connecté. Réessayez dans quelques secondes.');
                  }
                }, 7000);

                call.on('stream', (remote) => {
                  callConnectedRef.current = true;
                  clearInterval(retryTimer);
                  setRemoteStream(remote);
                  setCallStatus('connected');
                  setStatusDetail('');
                });

                call.on('close', () => {
                  callConnectedRef.current = false;
                  activeCallRef.current = null;
                  setRemoteStream(null);
                  setCallStatus('offline');
                });

                call.on('error', () => {
                  callConnectedRef.current = false;
                  activeCallRef.current = null;
                  setCallStatus('offline');
                  setStatusDetail('Le médecin n\'est pas encore connecté. Réessayez dans quelques secondes.');
                });
              } catch (e) {
                setCallStatus('offline');
                setStatusDetail('Le médecin n\'est pas encore en ligne.');
              }
            };

            attemptCall();
            retryTimer = setInterval(() => {
              if (!callConnectedRef.current && !activeCallRef.current) {
                attemptCall();
              }
              if (!dataConnRef.current?.open) {
                openChat();
              }
            }, 8000);
          });

          peer.on('error', (err) => {
            console.error('Peer error (patient):', err);
            if (err?.type === 'peer-unavailable') {
              activeCallRef.current = null;
              callConnectedRef.current = false;
              setCallStatus('offline');
              setStatusDetail('Le médecin n\'est pas encore connecté. Réessayez dans quelques secondes.');
              return;
            }
            setCallStatus('error');
          });
        }

        peerRef.current = peer;
      } catch (err) {
        console.error('Video join error:', err);
        setCallStatus('error');
        setStatusDetail(err.response?.data?.message || 'Impossible de démarrer l\'appel.');
      }
    };

    setupPeer();

    return () => {
      clearInterval(retryTimer);
      activeCallRef.current?.close();
      activeCallRef.current = null;
      dataConnRef.current?.close();
      dataConnRef.current = null;
      callConnectedRef.current = false;
      peerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, localStream, isDoctor, isPatient, doctorUserId, setupDataConnection]);

  const toggleCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsCameraOn(track.enabled);
      }
    } else {
      setIsCameraOn((v) => !v);
    }
  };

  const toggleMic = () => {
    const stream = streamRef.current;
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicOn(track.enabled);
      }
    } else {
      setIsMicOn((v) => !v);
    }
  };

  const endCall = () => {
    activeCallRef.current?.close();
    dataConnRef.current?.close();
    peerRef.current?.destroy();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    navigate(isDoctor ? '/dashboard' : '/patient');
  };

  const sendChat = (e) => {
    e.preventDefault();
    const text = chatDraft.trim();
    if (!text) return;
    const message = { id: Date.now(), type: 'chat', text };

    if (dataConnRef.current?.open) {
      dataConnRef.current.send(message);
    }

    setChatMessages((prev) => [
      ...prev,
      { id: message.id, from: 'me', text },
    ]);
    setChatDraft('');
  };

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (isPatient && !doctorUserId && !sessionMeta) {
    return <Navigate to="/doctors" />;
  }

  const doctorName =
    displayDoctor?.user?.name ||
    displayDoctor?.name ||
    sessionMeta?.doctor_name ||
    'Médecin';

  return (
    <div className="vc-page">
      <div className="vc-screen">
        <div className="vc-stage">
          <div className="vc-remote-wrap">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="vc-video vc-video--remote"
              />
            ) : (
              <div className="vc-remote-placeholder">
                <DoctorAvatar
                  doctor={displayDoctor}
                  name={doctorName}
                  size="xl"
                />
                <p className="vc-remote-name">
                  {isDoctor ? 'En attente du patient' : `Dr. ${doctorName}`}
                </p>
                <p className="vc-remote-status">{STATUS_LABELS[callStatus]}</p>
                {statusDetail ? (
                  <p className="vc-remote-hint">{statusDetail}</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="vc-pip">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="vc-video"
              style={{ display: isCameraOn ? 'block' : 'none' }}
            />
            {!isCameraOn && (
              <div className="vc-pip-off">
                <span>Vous</span>
                <small>Caméra off</small>
              </div>
            )}
          </div>

          <header className="vc-topbar">
            <div className="vc-topbar-doc">
              <DoctorAvatar doctor={displayDoctor} name={doctorName} size="sm" />
              <div>
                <span className="vc-topbar-name">
                  {isDoctor ? 'Salle médecin' : `Dr. ${doctorName}`}
                </span>
                <small>
                  {displayDoctor?.specialty?.name ?? 'Consultation vidéo'}
                </small>
              </div>
            </div>
            <div className="vc-topbar-meta">
              <span className="vc-badge vc-badge--live">● En direct</span>
              <span className="vc-timer">{formatTime(timer)}</span>
              <span className="vc-badge">{STATUS_LABELS[callStatus]}</span>
            </div>
          </header>

          <aside className="vc-chat">
            <div className="vc-chat-title">Chat consultation</div>
            <div className="vc-chat-messages">
              {chatMessages.length === 0 ? (
                <p className="vc-chat-empty">Messages pendant la consultation</p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`vc-chat-bubble${msg.from === 'me' ? ' vc-chat-bubble--me' : ''}`}
                  >
                    {msg.text}
                  </div>
                ))
              )}
            </div>
            <form className="vc-chat-form" onSubmit={sendChat}>
              <input
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Message…"
              />
              <button type="submit" aria-label="Envoyer">
                ↑
              </button>
            </form>
          </aside>
        </div>

        <footer className="vc-controls">
          <div className="vc-controls-group">
            <button
              type="button"
              className={`vc-ctrl${isMicOn ? '' : ' vc-ctrl--off'}`}
              onClick={toggleMic}
              title="Micro"
            >
              {isMicOn ? '🎤' : '🔇'}
            </button>
            <button
              type="button"
              className={`vc-ctrl${isCameraOn ? '' : ' vc-ctrl--off'}`}
              onClick={toggleCamera}
              title="Caméra"
            >
              {isCameraOn ? '📹' : '🚫'}
            </button>
          </div>
          <button
            type="button"
            className="vc-ctrl vc-ctrl--hangup"
            onClick={endCall}
            title="Terminer"
          >
            Raccrocher
          </button>
          <div className="vc-controls-timer">{formatTime(timer)}</div>
        </footer>
      </div>
    </div>
  );
}
