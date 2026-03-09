'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/src/store';
import { clearAuth } from '@/src/store/authSlice';

interface SidebarProps {
  onCreateClick: () => void;
}

export default function Sidebar({ onCreateClick }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(clearAuth());
    router.push('/login');
  };

  return (
    <>
      <style>{`
        .ig-sidebar {
          position: fixed;
          left: 0; top: 0; bottom: 0;
          z-index: 100;
          width: 72px;
          background: #000;
          border-right: 1px solid #262626;
          display: flex;
          flex-direction: column;
          padding: 8px 0;
        }

        @media (min-width: 1280px) {
          .ig-sidebar { width: 244px; padding: 8px 12px; }
        }

        .ig-sidebar-header {
          padding: 20px 0 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 1280px) {
          .ig-sidebar-header { padding: 24px 12px 28px; justify-content: flex-start; }
        }

        .ig-logo-icon { display: flex; color: #f5f5f5; }

        .ig-logo-wordmark {
          display: none;
          font-size: 22px;
          font-weight: 700;
          color: #f5f5f5;
          letter-spacing: -0.5px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          white-space: nowrap;
        }

        @media (min-width: 1280px) {
          .ig-logo-wordmark { display: block; }
          .ig-logo-icon { display: none; }
        }

        .ig-nav-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .ig-nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 0;
          border-radius: 10px;
          cursor: pointer;
          color: #a8a8a8;
          transition: background 0.15s ease, color 0.15s ease;
          text-decoration: none;
          white-space: nowrap;
          justify-content: center;
          background: none;
          border: none;
          width: 100%;
          font-size: 15px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        @media (min-width: 1280px) {
          .ig-nav-item { justify-content: flex-start; padding: 12px 12px; }
        }

        .ig-nav-item:hover { background: #1a1a1a; color: #f5f5f5; }
        .ig-nav-item.active { color: #f5f5f5; }
        .ig-nav-item.active:hover { background: #1a1a1a; }

        .ig-nav-label {
          display: none;
          font-weight: 400;
          color: inherit;
        }

        .ig-nav-item.active .ig-nav-label { font-weight: 600; }

        @media (min-width: 1280px) {
          .ig-nav-label { display: block; }
        }

        .ig-avatar-wrap {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #333;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 2px solid transparent;
          transition: border-color 0.15s ease;
        }

        .ig-nav-item.active .ig-avatar-wrap { border-color: #f5f5f5; }

        /* Logout pinned at bottom */
        .ig-logout-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 0;
          border-radius: 10px;
          cursor: pointer;
          color: #737373;
          transition: background 0.15s ease, color 0.15s ease;
          white-space: nowrap;
          justify-content: center;
          background: none;
          border: none;
          width: 100%;
          font-size: 15px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin-bottom: 8px;
        }

        @media (min-width: 1280px) {
          .ig-logout-btn { justify-content: flex-start; padding: 12px 12px; }
        }

        .ig-logout-btn:hover { background: #1a0000; color: #ed4956; }

        .ig-logout-label {
          display: none;
          font-weight: 400;
          color: inherit;
        }

        @media (min-width: 1280px) {
          .ig-logout-label { display: block; }
        }
      `}</style>

      <nav className="ig-sidebar">
        {/* Logo */}
        <div className="ig-sidebar-header">
          <div className="ig-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
            </svg>
          </div>
          <span className="ig-logo-wordmark">Instagram</span>
        </div>

        {/* Nav */}
        <div className="ig-nav-list">
          <Link href="/" className={`ig-nav-item ${pathname === '/' ? ' active' : ''}`}>
             <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                d="M9.02 2.84 3.63 7.04C2.73 7.72 2 9.23 2 10.36v7.41C2 19.92 3.07 21 4.3 21h3.4c1.23 0 2.3-1.08 2.3-2.23v-3c0-1.23 1.07-2.3 2-2.3s2 1.07 2 2.3v3c0 1.15 1.07 2.23 2.3 2.23h3.4c1.23 0 2.3-1.08 2.3-2.23V10.36c0-1.13-.73-2.64-1.63-3.32L14.98 2.85c-1.28-.99-3.35-.95-4.66-.01Z"
                stroke="currentColor"
                strokeWidth={pathname === '/' ? 2.2 : 1.8}
                fill={pathname === '/' ? 'currentColor' : 'none'}
              />
            </svg>
            <span className="ig-nav-label">Home</span>
          </Link>
          <button className="ig-nav-item" onClick={onCreateClick}>
             <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="ig-nav-label">Create</span>
          </button>

          {/* Profile */}
          <Link href="/profile" className={`ig-nav-item${pathname === '/profile' ? ' active' : ''}`}>
            <div className="ig-avatar-wrap">
              {user?.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#a8a8a8' }}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <span className="ig-nav-label">Profile</span>
          </Link>

        </div>

        {/* Logout — pinned to bottom */}
        <button className="ig-logout-btn" onClick={handleLogout}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="ig-logout-label">Log out</span>
        </button>
      </nav>
    </>
  );
}