import React from 'react';
import { getDoctorPhotoUrl } from '../utils/doctorPhoto';

function getInitials(name) {
  return (name || 'DR')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function DoctorAvatar({
  doctor,
  name,
  size = 'md',
  className = '',
}) {
  const displayName = name || doctor?.name || doctor?.user?.name || 'Médecin';
  const photoUrl = getDoctorPhotoUrl(doctor);
  const initials = getInitials(displayName);

  // 👇 Add these two lines HERE, before the return
  console.log('doctor object:', doctor);
  console.log('resolved photoUrl:', photoUrl);

  return (
    <div
      className={`doc-avatar doc-avatar--${size} ${photoUrl ? 'doc-avatar--photo' : ''} ${className}`.trim()}
      aria-hidden={photoUrl ? undefined : true}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="doc-avatar-img" />
      ) : (
        initials
      )}
    </div>
  );
}