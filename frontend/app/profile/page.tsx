'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { postAPI } from '@/src/lib/api';
import { useAppSelector } from '@/src/store';
import { useRouter } from 'next/navigation';
import Navbar from '@/src/components/Navbar';
import Sidebar from '@/src/components/Sidebar';
import PostCard from '@/src/components/PostCard';
import CreatePostModal from '@/src/components/CreatePostModal';
import Image from 'next/image';

export default function ProfilePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage]             = useState(1);
  const [posts, setPosts]           = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const itemsPerPage = 12;

  const { isAuthenticated, user } = useAppSelector((s: any) => s.auth);
  const router    = useRouter();
  const endRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    loadPosts(1);
  }, [isAuthenticated]);

  useEffect(() => {
    if (page > 1) loadPosts(page);
  }, [page]);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && posts.length < total && !loading) setPage(p => p + 1);
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [posts.length, total, loading]);

  const loadPosts = async (p: number) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await postAPI.getUserPosts(user.id, p, itemsPerPage);
      const { posts: loaded, pagination } = res.data.data;
      setPosts(prev => p === 1 ? loaded : [...prev, ...loaded]);
      setTotal(pagination.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDeleted = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    setTotal(prev => prev - 1);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#000' }}>
      <Navbar onCreateClick={() => setShowCreateModal(true)} />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar onCreateClick={() => setShowCreateModal(true)} />

        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 16px 72px' }}>
            <div style={{ width: '100%', maxWidth: 935 }}>

              {/* ── Header ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 36, marginBottom: 44, padding: '0 4px', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0, position: 'relative', width: 106, height: 106 }}>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%', padding: 2.5, boxSizing: 'border-box',
                    background: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)',
                  }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {user?.profile_picture_url
                        ? <img src={user.profile_picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        : <span style={{ fontSize: 36, fontWeight: 300, color: '#333' }}>{user?.username?.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 180, paddingTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.3px' }}>
                      {user?.username}
                    </h1>
                    <button style={{
                      background: '#161616', border: '1px solid #2a2a2a', color: '#e0e0e0',
                      fontSize: 13, fontWeight: 600, borderRadius: 8, padding: '6px 16px', cursor: 'pointer',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1e1e1e'; (e.currentTarget as HTMLElement).style.borderColor = '#333'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#161616'; (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a'; }}
                    >
                      Edit profile
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 28, marginBottom: 10, flexWrap: 'wrap' }}>
                    {[['posts', total], ['followers', 0], ['following', 0]].map(([label, count]) => (
                      <span key={label as string} style={{ fontSize: 14, color: '#555' }}>
                        <strong style={{ color: '#f0f0f0', fontWeight: 600 }}>{count as number}</strong>
                        {' '}{label}
                      </span>
                    ))}
                  </div>

                  {user?.bio && (
                    <p style={{ margin: 0, fontSize: 14, color: '#888', lineHeight: 1.55, maxWidth: 380 }}>
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Tabs ── */}
              <div style={{ borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'center', gap: 44 }}>
                {(['grid', 'list'] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
                    borderTop: viewMode === m ? '2px solid #f0f0f0' : '2px solid transparent',
                    marginTop: -1,
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: viewMode === m ? '#f0f0f0' : '#404040',
                    transition: 'color 0.2s',
                  }}>
                    {m === 'grid'
                      ? <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.8"/></svg>
                      : <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>
                    }
                    {m === 'grid' ? 'Posts' : 'Feed'}
                  </button>
                ))}
              </div>

              {/* ── Content ── */}
              {loading && !posts.length ? (
                <Spinner pad={80}/>
              ) : !posts.length ? (
                <EmptyPosts onCreateClick={() => setShowCreateModal(true)}/>
              ) : viewMode === 'grid' ? (
                <GridView posts={posts} loading={loading}/>
              ) : (
                <ListView posts={posts} userId={user?.id} onDeleted={handleDeleted} loading={loading}/>
              )}

              <div ref={endRef} style={{ height: 32 }}/>
            </div>
          </div>
        </main>
      </div>

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={() => { setPage(1); setPosts([]); loadPosts(1); }}
      />
    </div>
  );
}

/* ── Sub-components ── */

function Spinner({ pad = 40 }: { pad?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: pad }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#444', animation: 'spin 0.8s linear infinite' }}/>
    </div>
  );
}

function EmptyPosts({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 10, textAlign: 'center' }}>
      <div style={{ width: 58, height: 58, borderRadius: '50%', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a2a2a' }}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      </div>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 300, color: '#e0e0e0' }}>Share Photos</p>
      <p style={{ margin: 0, fontSize: 13, color: '#333' }}>When you share photos, they will appear on your profile.</p>
      <button onClick={onCreateClick} style={{ background: 'none', border: 'none', color: '#0095f6', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        Share your first photo
      </button>
    </div>
  );
}

function GridView({ posts, loading }: { posts: any[]; loading: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3, paddingBottom: 48 }}>
      {posts.map(p => <GridCell key={p.id} post={p}/>)}
      {loading && (
        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#444', animation: 'spin 0.8s linear infinite' }}/>
        </div>
      )}
    </div>
  );
}

function GridCell({ post }: { post: any }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', background: '#0d0d0d' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {post.media_urls?.[0]
        ? <Image src={post.media_urls[0]} alt="" fill style={{ objectFit: 'cover', transition: 'transform 0.35s', transform: hov ? 'scale(1.04)' : 'scale(1)' }} unoptimized/>
        : <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a2a2a', fontSize: 12 }}>No image</div>
      }
      {post.media_urls?.length > 1 && (
        <div style={{ position: 'absolute', top: 7, right: 7, zIndex: 2 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><rect x="6" y="2" width="16" height="16" rx="2" stroke="white" strokeWidth="1" fill="none"/><rect x="2" y="6" width="16" height="16" rx="2" fill="white" fillOpacity="0.7"/></svg>
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', opacity: hov ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        {[
          { icon: <svg width="16" height="16" fill="white" viewBox="0 0 48 48"><path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"/></svg>, count: post.like_count || 0 },
          { icon: <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" strokeLinejoin="round"/></svg>, count: post.comment_count || 0 },
        ].map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 14, fontWeight: 700 }}>
            {item.icon}{item.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function ListView({ posts, userId, onDeleted, loading }: { posts: any[]; userId?: string; onDeleted: (id: string) => void; loading: boolean }) {
  const PostCard = require('@/src/components/PostCard').default;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, paddingBottom: 48 }}>
      {posts.map(p => <PostCard key={p.id} post={p} currentUserId={userId} onPostDeleted={onDeleted}/>)}
      {loading && <div style={{ padding: 20 }}><div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: '#444', animation: 'spin 0.8s linear infinite' }}/></div>}
    </div>
  );
}