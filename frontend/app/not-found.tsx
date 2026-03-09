'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: '#000', 
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(237, 73, 86, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: '#ed4956'
        }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 12px', color: '#f5f5f5' }}>
          Page Not Found
        </h1>
        
        <p style={{ fontSize: '15px', color: '#a8a8a8', margin: '0 0 32px', lineHeight: '1.5' }}>
          The link you followed may be broken, or the page may have been removed.
        </p>
        
        <button 
          onClick={() => router.push('/login')} 
          style={{ 
            width: '100%',
            padding: '12px 20px', 
            background: '#0095f6', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1877f2'}
          onMouseOut={(e) => e.currentTarget.style.background = '#0095f6'}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
