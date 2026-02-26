import React from 'react';

export interface Module {
  name: string;
  label: string;
  version: string;
  loaded: boolean;
}

interface ModulesModalProps {
  isOpen: boolean;
  modules: Module[];
  onClose: () => void;
}

const ModulesModal: React.FC<ModulesModalProps> = ({ isOpen, modules, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#0d0d0d',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '32px',
          minWidth: '600px',
          maxWidth: '80vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #333',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#fff' }}>
            Loaded Modules
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0a0a0',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#a0a0a0')}
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        {modules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#a0a0a0' }}>
            <p>No modules loaded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {modules.map((module) => (
              <div
                key={module.name}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: `1px solid ${module.loaded ? '#22c55e' : '#333'}`,
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>📦</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#60a5fa' }}>
                        {module.label}
                      </h3>
                      <div style={{ fontSize: '13px', color: '#a0a0a0', marginTop: '4px' }}>
                        {module.name}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: module.loaded ? '#22c55e20' : '#71717a20',
                      border: `1px solid ${module.loaded ? '#22c55e' : '#71717a'}`,
                      fontSize: '12px',
                      fontWeight: '600',
                      color: module.loaded ? '#22c55e' : '#a0a0a0',
                    }}
                  >
                    <span>{module.loaded ? '●' : '○'}</span>
                    <span>{module.loaded ? 'LOADED' : 'NOT LOADED'}</span>
                  </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '13px', color: '#a0a0a0' }}>
                  <strong style={{ color: '#e0e0e0' }}>Version:</strong> {module.version}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ModulesModal;