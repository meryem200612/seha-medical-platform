import React from 'react';

export default function PageHero({
  image = '/hero3.jpeg',
  overline,
  title,
  lead,
  children,
  className = '',
}) {
  return (
    <header className={`page-hero ${className}`.trim()}>
      <div className="page-hero-visual" aria-hidden="true">
        <img src={image} alt="" />
      </div>
      <div className="page-hero-content">
        {overline ? <p className="page-overline">{overline}</p> : null}
        {title ? <h1 className="page-heading">{title}</h1> : null}
        {lead ? <p className="page-lead">{lead}</p> : null}
        {children}
      </div>
    </header>
  );
}
