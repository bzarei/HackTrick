
// Extracted User Avatar component
interface UserAvatarProps {
  user?: { name?: string; email?: string };
  hasSession: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, hasSession }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px' }}>
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: hasSession ? '#4a5568' : '#666',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '16px',
      }}
    >
      {hasSession && user ? user.name?.charAt(0).toUpperCase() : '?'}
    </div>
    {hasSession && user && (
      <div style={{ fontSize: '12px', lineHeight: 1.2 }}>
        <div style={{ fontWeight: '600' }}>{user.name}</div>
        <div style={{ color: '#aaa', fontSize: '11px' }}>{user.email}</div>
      </div>
    )}
  </div>
);