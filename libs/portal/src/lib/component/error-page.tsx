import React from "react";


export const ErrorPage: React.FC = () => (
  <div style={{
    padding: '40px 20px',
    textAlign: 'center',
    background: '#1a1a1a', 
    color: '#fff',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Page Not Found</h1>
      <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '24px' }}>The page you're looking for doesn't exist.</p>
      <a href="/" style={{
        color: '#3b82f6',
        textDecoration: 'none',
        fontSize: '16px',
        padding: '8px 16px',
        border: '1px solid #3b82f6',
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        Go Home
      </a>
    </div>
  </div>
);