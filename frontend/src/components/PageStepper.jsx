import React from 'react';

export default function PageStepper({ step, total, label }) {
  return (
    <div className="page-stepper">
      {label ? <div className="page-stepper-label">{label}</div> : null}
      <div className="page-stepper-bar">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`page-stepper-segment${
              i < step ? ' page-stepper-segment--done' : ''
            }${i === step - 1 ? ' page-stepper-segment--active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
