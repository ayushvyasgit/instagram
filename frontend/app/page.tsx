'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { postAPI, userAPI } from '@/src/lib/api';
import { useAppSelector, useAppDispatch } from '@/src/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/src/components/Sidebar';
import CreatePostModal from '@/src/components/CreatePostModal';
import {
  setFeedPosts,
  appendFeedPosts,
  setFeedLoading,
  setFeedLoadingMore,
  removePost,
} from '@/src/store/postsSlice';
import PostCard from '@/src/components/PostCard';



// ─── Feed Page ────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { feedPosts, feedPage, feedHasMore, feedTotal, feedLoading, feedLoadingMore } =
    useAppSelector((state) => state.posts);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const scrollSentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadInitialFeed();
  }, [isAuthenticated]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.trim().length > 0) { performSearch(searchQuery.trim()); setShowDropdown(true); }
      else { setSearchResults([]); setShowDropdown(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!scrollSentinelRef.current || !feedHasMore || feedLoadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMorePosts(); },
      { threshold: 0.1 }
    );
    observer.observe(scrollSentinelRef.current);
    return () => observer.disconnect();
  }, [feedHasMore, feedLoadingMore, feedPage]);

  const performSearch = async (term: string) => {
    try {
      setIsSearching(true);
      const res = await userAPI.searchUsers(term);
      setSearchResults(res.data.data.users || []);
    } catch { } finally { setIsSearching(false); }
  };

  const loadInitialFeed = async () => {
    if (!user?.id) return;
    try {
      dispatch(setFeedLoading(true));
      const res = await postAPI.getUserPosts(user.id, 1, 10);
      const { posts, pagination } = res.data.data;
      dispatch(setFeedPosts({ posts, total: pagination.total, hasMore: pagination.hasMore }));
    } catch { dispatch(setFeedLoading(false)); }
  };

  const loadMorePosts = async () => {
    if (feedLoadingMore || !feedHasMore || !user?.id) return;
    try {
      dispatch(setFeedLoadingMore(true));
      const nextPage = feedPage + 1;
      const res = await postAPI.getUserPosts(user.id, nextPage, 10);
      const { posts, pagination } = res.data.data;
      if (posts.length > 0) dispatch(appendFeedPosts({ posts, total: pagination.total, hasMore: pagination.hasMore, page: nextPage }));
      else dispatch(setFeedLoadingMore(false));
    } catch { dispatch(setFeedLoadingMore(false)); }
  };

  const handlePostDeleted = useCallback((postId: string) => { dispatch(removePost(postId)); }, [dispatch]);
  const handlePostCreated = useCallback(() => { loadInitialFeed(); }, []);

  if (!isAuthenticated) return null;

  if (feedLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <div className="feed-spinner" />
        <style>{`
          .feed-spinner {
            width: 32px; height: 32px; border-radius: 50%;
            border: 2px solid #1a1a1a; border-top-color: #555;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* ── Base ── */
        .feed-root {
          display: flex;
          min-height: 100vh;
          background: #000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .feed-main {
          flex: 1;
          margin-left: 72px;
          display: flex;
          justify-content: center;
          padding: 40px 16px 80px;
        }

        @media (min-width: 1280px) { .feed-main { margin-left: 244px; } }

        .feed-col {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ── Search ── */
        .feed-search-wrap {
          position: relative;
        }

        .feed-search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .feed-search-icon {
          position: absolute;
          left: 14px;
          color: #555;
          pointer-events: none;
          display: flex;
        }

        .feed-search-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 11px 40px;
          font-size: 14px;
          color: #f0f0f0;
          outline: none;
          transition: border-color 0.2s ease, background 0.2s ease;
          box-sizing: border-box;
        }

        .feed-search-input::placeholder { color: #555; }

        .feed-search-input:focus {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.07);
        }

        .feed-search-clear {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: #555;
          display: flex;
          padding: 0;
          transition: color 0.15s;
        }

        .feed-search-clear:hover { color: #a8a8a8; }

        .feed-search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0; right: 0;
          background: rgba(20,20,20,0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          z-index: 50;
          box-shadow: 0 16px 48px rgba(0,0,0,0.6);
        }

        .feed-search-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.15s;
        }

        .feed-search-item:last-child { border-bottom: none; }
        .feed-search-item:hover { background: rgba(255,255,255,0.05); }

        .feed-search-avatar {
          width: 42px; height: 42px; border-radius: 50%;
          background: #1a1a1a; overflow: hidden;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .feed-search-msg {
          padding: 16px; text-align: center; font-size: 14px; color: #555;
        }

        /* ── Glass Card ── */
        .gc-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }

        .gc-card:hover {
          border-color: rgba(255,255,255,0.13);
          box-shadow: 0 8px 40px rgba(0,0,0,0.55);
        }

        /* Header */
        .gc-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px 12px;
          position: relative;
        }

        .gc-avatar-ring {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          padding: 2px;
          background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
        }

        .gc-avatar {
          width: 100%; height: 100%; border-radius: 50%;
          background: #111; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #000;
        }

        .gc-avatar-img { width: 100%; height: 100%; object-fit: cover; }

        .gc-avatar-initial {
          font-size: 16px; font-weight: 600; color: #888;
        }

        .gc-header-info {
          display: flex; flex-direction: column; gap: 1px; flex: 1;
        }

        .gc-username {
          font-size: 14px; font-weight: 600; color: #f0f0f0; letter-spacing: 0.1px;
        }

        .gc-time {
          font-size: 11px; color: #555; font-weight: 400;
        }

        /* Menu */
        .gc-menu-wrap { position: relative; }

        .gc-menu-btn {
          background: none; border: none; cursor: pointer;
          color: #555; padding: 4px; display: flex; border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }

        .gc-menu-btn:hover { color: #a8a8a8; background: rgba(255,255,255,0.06); }

        .gc-menu-dropdown {
          position: absolute; right: 0; top: calc(100% + 4px);
          background: rgba(18,18,18,0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          min-width: 140px;
          z-index: 10;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }

        .gc-menu-option {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; font-size: 13px; font-weight: 500;
          cursor: pointer; background: none; border: none;
          width: 100%; font-family: inherit;
          transition: background 0.15s;
        }

        .gc-menu-delete { color: #ed4956; }
        .gc-menu-delete:hover { background: rgba(237,73,86,0.1); }

        /* Image */
        .gc-image-wrap {
          margin: 0 12px;
          border-radius: 14px;
          overflow: hidden;
          aspect-ratio: 1 / 1;
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .gc-image {
          width: 100%; height: 100%; object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .gc-image-wrap:hover .gc-image { transform: scale(1.02); }

        /* Actions */
        .gc-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 14px 6px;
        }

        .gc-action-btn {
          background: none; border: none; cursor: pointer;
          color: #a8a8a8; padding: 7px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;
        }

        .gc-action-btn:hover {
          color: #f0f0f0;
          background: rgba(255,255,255,0.06);
          transform: scale(1.08);
        }

        .gc-liked { color: #ed4956 !important; }
        .gc-liked:hover { color: #ed4956 !important; }

        .gc-bookmark { margin-left: auto; }

        /* Likes */
        .gc-likes {
          padding: 2px 16px 0;
          font-size: 13px;
          font-weight: 600;
          color: #e0e0e0;
        }

        /* Caption */
        .gc-caption {
          padding: 6px 16px 4px;
          font-size: 13.5px;
          color: #c8c8c8;
          line-height: 1.5;
        }

        .gc-caption-user {
          font-weight: 700;
          color: #f0f0f0;
          margin-right: 4px;
        }

        /* Comments hint */
        .gc-comments-hint {
          padding: 2px 16px 14px;
          font-size: 12px;
          color: #555;
          cursor: pointer;
          transition: color 0.15s;
        }

        .gc-comments-hint:hover { color: #888; }

        /* No-image card bottom padding */
        .gc-card:not(:has(.gc-image-wrap)) .gc-actions {
          padding-top: 4px;
        }

        /* ── Empty state ── */
        .feed-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 0;
          text-align: center;
          gap: 12px;
        }

        .feed-empty-icon {
          width: 80px; height: 80px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          color: #444;
          background: rgba(255,255,255,0.03);
        }

        .feed-empty h2 {
          font-size: 20px; font-weight: 300; color: #a8a8a8; margin: 0;
        }

        .feed-empty p { font-size: 14px; color: #444; margin: 0; }

        /* ── Load more / caught up ── */
        .feed-spinner {
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid #1a1a1a; border-top-color: #555;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .feed-caught-up {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 32px 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .feed-caught-up-icon { color: #1dbf73; }

        .feed-caught-up h2 {
          font-size: 16px; font-weight: 600; color: #a8a8a8; margin: 0;
        }

        .feed-caught-up p { font-size: 13px; color: #444; margin: 0; }
      `}</style>

      <div className="feed-root">
        <Sidebar onCreateClick={() => setShowCreateModal(true)} />

        <main className="feed-main">
          <div className="feed-col">

            {/* Search */}
            <div className="feed-search-wrap" ref={searchRef}>
              <div className="feed-search-box">
                <span className="feed-search-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  type="text"
                  className="feed-search-input"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length > 0 && setShowDropdown(true)}
                />
                {searchQuery && (
                  <button
                    className="feed-search-clear"
                    onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>

              {showDropdown && (
                <div className="feed-search-dropdown">
                  {isSearching ? (
                    <div className="feed-search-msg">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <div 
                        key={result.id} 
                        className="feed-search-item"
                        onClick={() => {
                          setShowDropdown(false);
                          router.push(`/profile/${result.id}`);
                        }}
                      >
                        <div className="feed-search-avatar">
                          {result.profile_picture_url ? (
                            <img src={result.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                          ) : (
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#666' }}>
                              {result.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#e0e0e0' }}>{result.username}</div>
                          {result.bio && (
                            <div style={{ fontSize: '12px', color: '#555', marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {result.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="feed-search-msg">No results for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Posts */}
            {feedPosts.length === 0 ? (
              <div className="feed-empty">
                <div className="feed-empty-icon">
                  <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.4"/>
                  </svg>
                </div>
                <h2>Nothing here yet</h2>
                <p>No one has shared anything yet — be the first.</p>
              </div>
            ) : (
              feedPosts.map((post: any) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onPostDeleted={handlePostDeleted}
                />
              ))
            )}

            {/* Infinite scroll sentinel */}
            {feedHasMore && feedPosts.length > 0 && (
              <div ref={scrollSentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                {feedLoadingMore && <div className="feed-spinner" />}
              </div>
            )}

            {/* All caught up */}
            {!feedHasMore && feedPosts.length > 0 && (
              <div className="feed-caught-up">
                <div className="feed-caught-up-icon">
                  <svg width="36" height="36" fill="none" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.5"/>
                    <polyline points="14 24 21 31 34 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>You're all caught up</h2>
                <p>You've seen all {feedTotal} posts.</p>
              </div>
            )}

          </div>
        </main>

        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      </div>
    </>
  );
}