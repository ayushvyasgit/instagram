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
        /*
         * CSS vars are defined in Navbar.tsx (:root).
         * Sidebar just consumes them — no duplication.
         */

        .sb {
          position: fixed;
          left: 0;
          top: var(--nb-h);        /* starts below navbar */
          bottom: 0;
          width: var(--sb-w);
          z-index: 200;
          background: rgba(0,0,0,0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 10px 0;
          box-sizing: border-box;
          transition: width 0.25s ease;
        }
        @media (min-width: 1280px) {
          .sb { width: var(--sb-w-xl); padding: 10px 10px; }
        }

        /* In-flow spacer — same width as fixed sidebar */
        .sb-spacer {
          flex-shrink: 0;
          width: var(--sb-w);
        }
        @media (min-width: 1280px) {
          .sb-spacer { width: var(--sb-w-xl); }
        }

        /* ── Nav items ── */
        .sb-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .sb-list::-webkit-scrollbar { display: none; }

        .sb-item {
          display: flex;
          align-items: center;
          gap: 14px;
          height: 48px;
          padding: 0;
          justify-content: center;
          border-radius: 10px;
          cursor: pointer;
          color: var(--text-secondary);
          text-decoration: none;
          white-space: nowrap;
          background: none;
          border: none;
          width: 100%;
          font-size: 15px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          transition: background 0.14s, color 0.14s;
        }
        @media (min-width: 1280px) {
          .sb-item { justify-content: flex-start; padding: 0 12px; }
        }
        .sb-item:hover  { background: var(--bg-hover); color: var(--text-primary); }
        .sb-item.active { color: var(--text-primary); }
        .sb-item.active:hover { background: var(--bg-hover); }

        .sb-label {
          display: none;
          font-weight: 400;
          font-size: 15px;
          color: inherit;
        }
        .sb-item.active .sb-label { font-weight: 600; }
        @media (min-width: 1280px) { .sb-label { display: block; } }

        /* Avatar */
        .sb-avatar {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: #1e1e1e;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          border: 1.5px solid transparent;
          transition: border-color 0.14s;
        }
        .sb-item.active .sb-avatar { border-color: var(--text-primary); }
        .sb-avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* Divider */
        .sb-divider {
          height: 1px;
          background: var(--border);
          margin: 6px 10px;
        }
        @media (min-width: 1280px) { .sb-divider { margin: 6px 12px; } }

        /* Logout */
        .sb-logout {
          display: flex;
          align-items: center;
          gap: 14px;
          height: 44px;
          padding: 0;
          justify-content: center;
          border-radius: 10px;
          cursor: pointer;
          color: var(--text-muted);
          background: none;
          border: none;
          width: 100%;
          font-size: 15px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          transition: background 0.14s, color 0.14s;
          flex-shrink: 0;
          margin-bottom: 6px;
        }
        @media (min-width: 1280px) { .sb-logout { justify-content: flex-start; padding: 0 12px; } }
        .sb-logout:hover { background: rgba(237,73,86,0.08); color: #ed4956; }
        .sb-logout-label {
          display: none; font-weight: 400; color: inherit; font-size: 15px;
        }
        @media (min-width: 1280px) { .sb-logout-label { display: block; } }
      `}</style>

      {/* ── Fixed sidebar ── */}
      <nav className="sb" aria-label="Main navigation">

        <div className="sb-list">

          {/* Home */}
          <Link href="/" className={`sb-item${pathname === '/' ? ' active' : ''}`}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path
                d="M9.02 2.84 3.63 7.04C2.73 7.72 2 9.23 2 10.36v7.41C2 19.92 3.07 21 4.3 21h3.4c1.23 0 2.3-1.08 2.3-2.23v-3c0-1.23 1.07-2.3 2-2.3s2 1.07 2 2.3v3c0 1.15 1.07 2.23 2.3 2.23h3.4c1.23 0 2.3-1.08 2.3-2.23V10.36c0-1.13-.73-2.64-1.63-3.32L14.98 2.85c-1.28-.99-3.35-.95-4.66-.01Z"
                stroke="currentColor"
                strokeWidth={pathname === '/' ? 2.2 : 1.8}
                fill={pathname === '/' ? 'currentColor' : 'none'}
              />
            </svg>
            <span className="sb-label">Home</span>
          </Link>

          {/* Create */}
          <button className="sb-item" onClick={onCreateClick}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="sb-label">Create</span>
          </button>

          {/* Profile */}
          <Link href="/profile" className={`sb-item${pathname === '/profile' ? ' active' : ''}`}>
            <div className="sb-avatar">
              {user?.profile_picture_url
                ? <img src={user.profile_picture_url} alt=""/>
                : <span style={{ fontSize: '10px', fontWeight: 700, color: '#555' }}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
              }
            </div>
            <span className="sb-label">Profile</span>
          </Link>

        </div>

        <div className="sb-divider"/>

        {/* Logout */}
        <button className="sb-logout" onClick={handleLogout}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="sb-logout-label">Log out</span>
        </button>
      </nav>

      {/* ── In-flow spacer — pushes page content right ── */}
      <div className="sb-spacer" aria-hidden="true"/>
    </>
  );
}