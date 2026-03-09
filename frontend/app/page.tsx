'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { postAPI } from '@/src/lib/api';
import { useAppSelector, useAppDispatch } from '@/src/store';
import { useRouter } from 'next/navigation';
import Navbar from '@/src/components/Navbar';
import Sidebar from '@/src/components/Sidebar';
import CreatePostModal from '@/src/components/CreatePostModal';
import { setFeedLoading, removePost, setFeedPostsCursor } from '@/src/store/postsSlice';
import PostCard from '@/src/components/PostCard';

export default function FeedPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { isAuthenticated, user } = useAppSelector((state: any) => state.auth);
  const { feedPosts, feedLoading, feedNextCursor, feedHasNextPage } =
    useAppSelector((state: any) => state.posts);
  const dispatch = useAppDispatch();
  const router  = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadCursor(null, 'next');
  }, [isAuthenticated]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && feedHasNextPage && feedNextCursor && !loadingMore) loadMore();
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [feedHasNextPage, feedNextCursor, loadingMore]);

  const loadCursor = async (cursor: string | null, dir: 'next' | 'prev') => {
    try {
      dispatch(setFeedLoading(true));
      const res = await postAPI.getFeedCursor(10, cursor, dir);
      const { posts, pagination } = res.data.data;
      dispatch(setFeedPostsCursor({
        posts,
        nextCursor: pagination.nextCursor,
        prevCursor: pagination.prevCursor,
        hasNextPage: pagination.hasNextPage,
        hasPreviousPage: pagination.hasPreviousPage,
      }));
    } catch { dispatch(setFeedLoading(false)); }
  };

  const loadMore = async () => {
    if (!feedHasNextPage || !feedNextCursor) return;
    setLoadingMore(true);
    try { await loadCursor(feedNextCursor, 'next'); }
    finally { setLoadingMore(false); }
  };

  const handlePostDeleted = useCallback(
    (id: string) => dispatch(removePost(id)), [dispatch]
  );

  if (!isAuthenticated) return null;

  return (
    /*
     * Layout:
     *   <Navbar>  renders fixed header + nb-spacer (height: var(--nb-h))
     *   <Sidebar> renders fixed nav   + sb-spacer (width: var(--sb-w / --sb-w-xl))
     *   <main>    takes all remaining width naturally
     */
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#000' }}>
      <Navbar onCreateClick={() => setShowCreateModal(true)} />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar onCreateClick={() => setShowCreateModal(true)} />

        <main style={{ flex: 1, minWidth: 0 }}>
          {feedLoading && !feedPosts.length ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#444', animation: 'spin 0.8s linear infinite' }}/>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 16px 72px' }}>
              <div style={{ width: '100%', maxWidth: 470 }}>

                {/* Empty state */}
                {!feedPosts.length && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 10, textAlign: 'center' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a2a2a' }}>
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.3"/>
                      </svg>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 300, color: '#444', margin: 0 }}>Nothing here yet</p>
                    <p style={{ fontSize: 13, color: '#2a2a2a', margin: 0 }}>Follow people to see their posts.</p>
                  </div>
                )}

                {/* Posts */}
                {feedPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} currentUserId={user?.id} onPostDeleted={handlePostDeleted}/>
                ))}

                {/* Load-more sentinel */}
                {(feedHasNextPage || loadingMore) && (
                  <div ref={sentinelRef} style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {loadingMore && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#444', animation: 'spin 0.8s linear infinite' }}/>
                    )}
                  </div>
                )}

                {/* All caught up */}
                {!feedHasNextPage && feedPosts.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 0', borderTop: '1px solid #0f0f0f', marginTop: 8 }}>
                    <svg width="16" height="16" fill="#22c55e" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span style={{ fontSize: 12, color: '#333' }}>You're all caught up</span>
                  </div>
                )}

              </div>
            </div>
          )}
        </main>
      </div>

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={() => loadCursor(null, 'next')}
      />
    </div>
  );
}