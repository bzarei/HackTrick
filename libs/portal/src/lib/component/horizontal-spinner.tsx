import React from 'react';


export const HorizontalSpinner: React.FC<{ active?: boolean }> = ({
  active = true,
}) => {
  if (!active) return null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 4,
        background: '#e5e7eb',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '-30%',
          width: '30%',
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
          animation: 'spinner-slide 1.1s linear infinite',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
        }}
      />

      <style>
        {`@keyframes spinner-slide {
          from { transform: translateX(0); }
          to { transform: translateX(430%); }
        }`}
      </style>
    </div>
  );
};