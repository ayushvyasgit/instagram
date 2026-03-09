'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { userAPI } from '@/src/lib/api';

interface NavbarProps {
  onCreateClick: () => void;
}

export default function Navbar({ onCreateClick }: NavbarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  /* close dropdown on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* debounced search */
  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await userAPI.searchUsers(query.trim());
        setResults(res.data.data.users || []);
        setOpen(true);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 320);
    return () => clearTimeout(t);
  }, [query]);

  const navigate = (id: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/profile/${id}`);
  };

  return (
    <>
      <style>{`
        /* ─── CSS vars shared across Navbar + Sidebar ─── */
        :root {
          --nb-h: 52px;          /* navbar height                  */
          --sb-w: 68px;          /* sidebar collapsed width        */
          --sb-w-xl: 240px;      /* sidebar expanded width (≥1280) */
          --bg-base: #000000;
          --bg-surface: #0a0a0a;
          --bg-elevated: #141414;
          --bg-hover: rgba(255,255,255,0.05);
          --border: rgba(255,255,255,0.07);
          --text-primary: #f5f5f5;
          --text-secondary: #737373;
          --text-muted: #404040;
          --accent: #0095f6;
        }

        /* ─── Navbar shell ─── */
        .nb {
          position: fixed;
          inset: 0 0 auto 0;
          height: var(--nb-h);
          z-index: 300;
          background: rgba(0,0,0,0.90);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 16px;
          box-sizing: border-box;
        }

        /* spacer that pushes page content below the fixed bar */
        .nb-spacer {
          height: var(--nb-h);
          flex-shrink: 0;
        }

        /* ─── Logo ─── */
        .nb-logo {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          flex-shrink: 0;
          user-select: none;
        }
        .nb-logo-icon { flex-shrink: 0; }
        .nb-logo-text {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.5px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #feda75 0%, #fa7e1e 20%, #d62976 50%, #962fbf 80%, #4f5bd5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
        }
        /* on narrow sidebar width, hide text */
        @media (max-width: 1279px) {
          .nb-logo-text { display: none; }
        }
        @media (min-width: 1280px) {
          .nb-logo-text { display: block; }
        }

        /* ─── Search ─── */
        .nb-search-wrap {
          flex: 1;
          max-width: 268px;
          margin: 0 auto;
          position: relative;
        }
        .nb-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 12px;
          background: var(--bg-elevated);
          border: 1.5px solid transparent;
          border-radius: 12px;
          transition: border-color 0.18s, background 0.18s;
        }
        .nb-search-box.is-focused {
          border-color: rgba(255,255,255,0.16);
          background: #0e0e0e;
        }
        .nb-search-icon { color: var(--text-muted); display: flex; flex-shrink: 0; transition: color 0.18s; }
        .nb-search-box.is-focused .nb-search-icon { color: var(--text-secondary); }
        .nb-search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-size: 14px;
          font-family: inherit;
          color: var(--text-primary);
          min-width: 0;
        }
        .nb-search-input::placeholder { color: var(--text-muted); }
        .nb-search-clear {
          background: none; border: none; padding: 2px; cursor: pointer;
          color: var(--text-muted); display: flex; flex-shrink: 0;
          border-radius: 50%; transition: color 0.15s, background 0.15s;
        }
        .nb-search-clear:hover { color: var(--text-secondary); background: rgba(255,255,255,0.06); }

        /* ─── Dropdown ─── */
        .nb-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0; right: 0;
          background: #111;
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.75);
          overflow: hidden;
          z-index: 400;
          animation: nb-dd-in 0.16s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes nb-dd-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .nb-dd-label {
          padding: 10px 14px 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .nb-dd-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 14px;
          cursor: pointer;
          transition: background 0.12s;
        }
        .nb-dd-item:hover { background: var(--bg-hover); }
        .nb-dd-item:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.04); }
        .nb-dd-av {
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          background: var(--bg-elevated);
          border: 1px solid rgba(255,255,255,0.07);
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .nb-dd-av img { width: 100%; height: 100%; object-fit: cover; }
        .nb-dd-av-init { font-size: 14px; font-weight: 600; color: var(--text-muted); }
        .nb-dd-name { font-size: 14px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-dd-bio  { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
        .nb-dd-empty {
          padding: 22px 14px;
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
        }
        .nb-dd-loading {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 18px 14px; font-size: 13px; color: var(--text-muted);
        }
        @keyframes nb-spin { to { transform: rotate(360deg); } }
        .nb-spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid #222; border-top-color: #555;
          animation: nb-spin 0.65s linear infinite;
          flex-shrink: 0;
        }

        /* ─── Right actions ─── */
        .nb-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; flex-shrink: 0; }
        .nb-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: none; border: none; cursor: pointer;
          color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
          position: relative;
        }
        .nb-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .nb-btn.nb-active { color: var(--text-primary); }

        /* notification dot */
        .nb-dot {
          position: absolute;
          top: 7px; right: 7px;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #ed4956;
          border: 1.5px solid #000;
        }
      `}</style>

      {/* ── Fixed navbar ── */}
      <header className="nb">
        {/* Logo */}
        <Link href="/" className="nb-logo" aria-label="Home">
          <span className="nb-logo-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="ig-g" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#feda75"/>
                  <stop offset="25%"  stopColor="#fa7e1e"/>
                  <stop offset="55%"  stopColor="#d62976"/>
                  <stop offset="80%"  stopColor="#962fbf"/>
                  <stop offset="100%" stopColor="#4f5bd5"/>
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig-g)" strokeWidth="1.8"/>
              <circle cx="12" cy="12" r="4" stroke="url(#ig-g)" strokeWidth="1.8"/>
              <circle cx="17.5" cy="6.5" r="1.3" fill="url(#ig-g)"/>
            </svg>
          </span>
          <span className="nb-logo-text">Instagram</span>
        </Link>

        {/* Search */}
        <div className="nb-search-wrap" ref={wrapRef}>
          <div className={`nb-search-box${focused ? ' is-focused' : ''}`}>
            <span className="nb-search-icon">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.9"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              ref={inputRef}
              className="nb-search-input"
              type="text"
              placeholder="Search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => { setFocused(true); if (results.length) setOpen(true); }}
              autoComplete="off"
            />
            {query && (
              <button className="nb-search-clear" onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.1)"/>
                  <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown */}
          {open && (
            <div className="nb-dropdown">
              {searching ? (
                <div className="nb-dd-loading">
                  <div className="nb-spinner"/>
                  Searching…
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="nb-dd-label">Results</div>
                  {results.map(u => (
                    <div key={u.id} className="nb-dd-item" onClick={() => navigate(u.id)}>
                      <div className="nb-dd-av">
                        {u.profile_picture_url
                          ? <img src={u.profile_picture_url} alt=""/>
                          : <span className="nb-dd-av-init">{u.username?.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="nb-dd-name">{u.username}</div>
                        {u.bio && <div className="nb-dd-bio">{u.bio}</div>}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="nb-dd-empty">No results for "{query}"</div>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="nb-actions">
          {/* Create */}
          <button className="nb-btn nb-active" onClick={onCreateClick} title="Create post">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          {/* Notifications */}
          <button className="nb-btn" title="Notifications">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="nb-dot"/>
          </button>
        </div>
      </header>

      {/* In-flow spacer */}
      <div className="nb-spacer" aria-hidden="true"/>
    </>
  );
}