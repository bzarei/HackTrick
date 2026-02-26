import React from 'react';

import { FeatureDescriptor } from '../model';

export const ErrorDisplay: React.FC<{
  error: Error;
  errorInfo?: React.ErrorInfo;
  feature?: FeatureDescriptor;
}> = ({ error, errorInfo, feature }) => {
  const [showStack, setShowStack] = React.useState(false);
  const [showComponentStack, setShowComponentStack] = React.useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '32px',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              ⚠️
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
                Component Error
              </h1>
              {feature && (
                <div style={{ marginTop: '4px', opacity: 0.9, fontSize: '14px' }}>
                  Feature: {feature.label || feature.id}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div style={{ padding: '32px' }}>
          <div
            style={{
              background: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>
              Error Message
            </div>
            <div style={{ fontSize: '15px', color: '#7f1d1d', lineHeight: '1.6', fontFamily: 'monospace' }}>
              {error.message || 'An unknown error occurred'}
            </div>
          </div>

          {/* Feature Details */}
          {feature && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                Feature Details
              </div>
              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>ID:</span>{' '}
                  <span style={{ color: '#111827' }}>{feature.id}</span>
                </div>
                {feature.component && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Component:</span>{' '}
                    <span style={{ color: '#111827' }}>{feature.component}</span>
                  </div>
                )}
                {(feature as any).module && (
                  <div>
                    <span style={{ color: '#6b7280' }}>Module:</span>{' '}
                    <span style={{ color: '#111827' }}>{(feature as any).module}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stack Trace */}
          {error.stack && (
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setShowStack(!showStack)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                <span>Stack Trace</span>
                <span style={{ fontSize: '12px' }}>{showStack ? '▼' : '▶'}</span>
              </button>

              {showStack && (
                <div
                  style={{
                    marginTop: '12px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                    color: '#e2e8f0',
                    overflowX: 'auto',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Component Stack */}
          {errorInfo?.componentStack && (
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setShowComponentStack(!showComponentStack)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                <span>Component Stack</span>
                <span style={{ fontSize: '12px' }}>{showComponentStack ? '▼' : '▶'}</span>
              </button>

              {showComponentStack && (
                <div
                  style={{
                    marginTop: '12px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                    color: '#e2e8f0',
                    overflowX: 'auto',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              Reload Page
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};