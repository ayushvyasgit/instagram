'use client';

import { useEffect, useState, useCallback } from 'react';
import { postAPI } from '@/src/lib/api';
import { useAppSelector, useAppDispatch } from '@/src/store';
import { setUserPosts, setUserPostsLoading, removePost } from '@/src/store/postsSlice';
import { useRouter } from 'next/navigation';
import Sidebar from '@/src/components/Sidebar';
import PostCard from '@/src/components/PostCard';
import CreatePostModal from '@/src/components/CreatePostModal';
import Image from 'next/image';

export default function ProfilePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { isAuthenticated, user } = useAppSelector((state: any) => state.auth);
  const { userPosts, userPostsTotal, userPostsLoading } = useAppSelector((state: any) => state.posts);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadMyPosts(currentPage);
  }, [isAuthenticated, currentPage]);

  const loadMyPosts = async (pageToLoad: number) => {
    if (!user?.id) return;
    try {
      dispatch(setUserPostsLoading(true));
      const response = await postAPI.getUserPosts(user.id, pageToLoad, itemsPerPage);
      const { posts, pagination } = response.data.data;
      dispatch(setUserPosts({ posts, total: pagination.total, hasMore: pagination.hasMore }));
    } catch (error) {
      console.error('Error loading posts:', error);
      dispatch(setUserPostsLoading(false));
    }
  };

  const handleNextPage = () => {
    if (currentPage * itemsPerPage < userPostsTotal) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePostDeleted = useCallback((postId: string) => {
    dispatch(removePost(postId));
  }, [dispatch]);

  if (!isAuthenticated) return null;

  return (
    <>
      <style>{`
        .profile-root {
          display: flex;
          min-height: 100vh;
          background: #000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .profile-main {
          flex: 1;
          margin-left: 72px;
          display: flex;
          justify-content: center;
        }

        @media (min-width: 1280px) { .profile-main { margin-left: 244px; } }

        .profile-content {
          width: 100%;
          max-width: 935px;
          padding: 32px 16px 0;
        }

        /* ── Header ── */
        .profile-header {
          display: flex;
          align-items: flex-start;
          gap: 32px;
          margin-bottom: 40px;
          padding: 0 16px;
        }

        @media (max-width: 640px) {
          .profile-header { flex-direction: column; align-items: center; text-align: center; gap: 20px; }
        }

        /* Avatar */
        .profile-avatar-ring {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
          flex-shrink: 0;
        }

        .profile-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #000;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #000;
        }

        .profile-avatar-initial {
          font-size: 52px;
          font-weight: 300;
          color: #555;
        }

        /* Info */
        .profile-info { flex: 1; }

        .profile-info-top {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .profile-username {
          font-size: 20px;
          font-weight: 300;
          color: #f5f5f5;
          letter-spacing: 0.2px;
        }

        .profile-edit-btn {
          background: #1a1a1a;
          border: 1px solid #363636;
          color: #f5f5f5;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          padding: 7px 16px;
          cursor: pointer;
          transition: background 0.15s ease;
          font-family: inherit;
        }

        .profile-edit-btn:hover { background: #262626; }

        .profile-stats {
          display: flex;
          gap: 40px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .profile-stat {
          font-size: 15px;
          color: #a8a8a8;
        }

        .profile-stat strong {
          color: #f5f5f5;
          font-weight: 600;
        }

        .profile-bio {
          font-size: 14px;
          color: #f5f5f5;
          line-height: 1.5;
          max-width: 480px;
        }

        /* ── Tabs ── */
        .profile-tabs {
          border-top: 1px solid #262626;
          display: flex;
          justify-content: center;
          gap: 56px;
        }

        .profile-tab {
          padding: 14px 0;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          border: none;
          background: none;
          font-family: inherit;
          transition: color 0.15s ease;
          border-top: 1px solid transparent;
          margin-top: -1px;
        }

        .profile-tab.active {
          border-top-color: #f5f5f5;
          color: #f5f5f5;
        }

        .profile-tab:not(.active) {
          color: #737373;
        }

        .profile-tab:not(.active):hover { color: #a8a8a8; }

        /* ── Loading ── */
        .profile-loading {
          display: flex;
          justify-content: center;
          padding: 80px 0;
        }

        .profile-spinner {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #262626;
          border-top-color: #a8a8a8;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Pagination buttons */
        .pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 32px 0 64px;
        }

        .pagination-btn {
          background: #1a1a1a;
          border: 1px solid #363636;
          color: #f5f5f5;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #262626;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Empty state ── */
        .profile-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          text-align: center;
        }

        .profile-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 2px solid #363636;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: #737373;
        }

        .profile-empty h2 {
          font-size: 28px;
          font-weight: 300;
          color: #f5f5f5;
          margin: 0 0 8px;
        }

        .profile-empty p {
          font-size: 14px;
          color: #737373;
          margin: 0 0 16px;
        }

        .profile-empty-cta {
          background: none;
          border: none;
          color: #0095f6;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
        }

        .profile-empty-cta:hover { color: #1aa3ff; }

        /* ── Grid ── */
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3px;
          padding-bottom: 64px;
        }

        .profile-grid-cell {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          cursor: pointer;
          background: #1a1a1a;
        }

        .profile-grid-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          opacity: 0;
          transition: opacity 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          color: #fff;
          font-weight: 700;
          font-size: 16px;
        }

        .profile-grid-cell:hover .profile-grid-overlay { opacity: 1; }

        .profile-grid-stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .profile-grid-no-img {
          width: 100%;
          height: 100%;
          background: #1c1c1c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #555;
        }

        /* ── List ── */
        .profile-list {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 64px;
          padding-top: 16px;
        }
      `}</style>

      <div className="profile-root">
        <Sidebar onCreateClick={() => setShowCreateModal(true)} />

        <main className="profile-main">
          <div className="profile-content">

            {/* ── Header ── */}
            <div className="profile-header">
              <div className="profile-avatar-ring">
                <div className="profile-avatar-inner">
                  {user?.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="profile-avatar-initial">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>

              <div className="profile-info">
                <div className="profile-info-top">
                  <h1 className="profile-username">{user?.username}</h1>
                  <button className="profile-edit-btn">Edit profile</button>
                </div>
                <div className="profile-stats">
                  <span className="profile-stat"><strong>{userPosts.length}</strong> posts</span>
                  <span className="profile-stat"><strong>0</strong> followers</span>
                  <span className="profile-stat"><strong>0</strong> following</span>
                </div>
                {user?.bio && <p className="profile-bio">{user.bio}</p>}
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="profile-tabs">
              <button
                className={`profile-tab${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Posts
              </button>
              <button
                className={`profile-tab${viewMode === 'list' ? ' active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Feed
              </button>
            </div>

            {/* ── Content ── */}
            {userPostsLoading ? (
              <div className="profile-loading">
                <div className="profile-spinner" />
              </div>
            ) : userPosts.length === 0 ? (
              <div className="profile-empty">
                <div className="profile-empty-icon">
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h2>Share Photos</h2>
                <p>When you share photos, they will appear on your profile.</p>
                <button className="profile-empty-cta" onClick={() => setShowCreateModal(true)}>
                  Share your first photo
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="profile-grid">
                {userPosts.map((post: any) => (
                  <div
                    key={post.id}
                    className="profile-grid-cell"
                    onClick={() => setViewMode('list')}
                  >
                    {post.media_urls?.[0] ? (
                      <Image
                        src={post.media_urls[0]}
                        alt=""
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    ) : (
                      <div className="profile-grid-no-img">No image</div>
                    )}
                    <div className="profile-grid-overlay">
                      <span className="profile-grid-stat">
                        <svg width="18" height="18" fill="white" viewBox="0 0 48 48">
                          <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"/>
                        </svg>
                        {post.like_count || 0}
                      </span>
                      <span className="profile-grid-stat">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                          <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="white" strokeLinejoin="round" strokeWidth="1.5"/>
                        </svg>
                        {post.comment_count || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="profile-list">
                {userPosts.map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    onPostDeleted={handlePostDeleted}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {userPostsTotal > itemsPerPage && (
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || userPostsLoading}
                >
                  Previous
                </button>
                <span style={{ color: '#888', fontSize: '14px' }}>
                  Page {currentPage} of {Math.ceil(userPostsTotal / itemsPerPage)}
                </span>
                <button 
                  className="pagination-btn"
                  onClick={handleNextPage}
                  disabled={currentPage * itemsPerPage >= userPostsTotal || userPostsLoading}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>

        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={() => {
            setCurrentPage(1);
            loadMyPosts(1);
          }}
        />
      </div>
    </>
  );
}