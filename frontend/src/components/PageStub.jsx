import React from 'react';
import PageHero from './PageHero';

/**
 * Standard inner page layout matching the Home design system.
 */
export default function PageStub({
  image = '/hero3.jpeg',
  overline,
  title,
  lead,
  children,
}) {
  return (
    <div className="app-page">
      <PageHero image={image} overline={overline} title={title} lead={lead} />
      <div className="app-page-body">{children}</div>
    </div>
  );
}
