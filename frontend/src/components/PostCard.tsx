'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { likeAPI, commentAPI, postAPI } from '@/src/lib/api';
import MediaCarousel from './MediaCarousel';

interface PostCardProps {
  post: any;
  currentUserId?: string;
  onPostDeleted?: (postId: string) => void;
  showDeleteOnly?: boolean;
}

export default function PostCard({ post, currentUserId, onPostDeleted, showDeleteOnly }: PostCardProps) {
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.like_count || 0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comment_count || 0);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentCard, setShowCommentCard] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [showRepliesFor, setShowRepliesFor] = useState<Record<string, boolean>>({});
  const lastTapRef = useRef<number>(0);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentUserId && (post.user_id === currentUserId || post.userId === currentUserId);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!liked) handleLike();
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    lastTapRef.current = now;
  };

  const handleLike = async () => {
    try {
      setLiked(true);
      setLikesCount((prev: number) => prev + 1);
      await likeAPI.likePost(post.id);
    } catch (error) {
      setLiked(false);
      setLikesCount((prev: number) => prev - 1);
    }
  };

  const handleUnlike = async () => {
    try {
      setLiked(false);
      setLikesCount((prev: number) => prev - 1);
      await likeAPI.unlikePost(post.id);
    } catch (error) {
      setLiked(true);
      setLikesCount((prev: number) => prev + 1);
    }
  };

  const handleLikeToggle = () => {
    if (liked) handleUnlike();
    else handleLike();
  };

  const openCommentCard = async () => {
    setShowCommentCard(true);
    if (!commentsLoaded) {
      try {
        const response = await commentAPI.getPostComments(post.id, 1, 20);
        setComments(response.data.data.comments);
        setCommentsLoaded(true);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    }
    setTimeout(() => commentInputRef.current?.focus(), 300);
  };

  const closeCommentCard = () => {
    setShowCommentCard(false);
    setReplyingTo(null);
  };

  // Lock body scroll when comment card is open
  useEffect(() => {
    if (showCommentCard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showCommentCard]);

  const loadReplies = async (commentId: string) => {
    if (showRepliesFor[commentId]) {
      setShowRepliesFor(prev => ({ ...prev, [commentId]: false }));
      return;
    }

    if (replies[commentId]) {
      setShowRepliesFor(prev => ({ ...prev, [commentId]: true }));
      return;
    }

    try {
      const response = await commentAPI.getCommentReplies(commentId, 1, 50);
      setReplies(prev => ({ ...prev, [commentId]: response.data.data.replies }));
      setShowRepliesFor(prev => ({ ...prev, [commentId]: true }));
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await commentAPI.createComment({
        postId: post.id,
        content: commentText.trim(),
        parentId: replyingTo?.id
      });
      if (replyingTo) {
         setReplies(prev => ({
           ...prev,
           [replyingTo.id]: [...(prev[replyingTo.id] || []), response.data.data.comment]
         }));
         setShowRepliesFor(prev => ({ ...prev, [replyingTo.id]: true }));
         setComments(prev => prev.map(c => c.id === replyingTo.id ? { ...c, reply_count: (c.reply_count || 0) + 1 } : c));
      } else {
         setCommentsCount((prev: number) => prev + 1);
         if (commentsLoaded) {
           setComments(prev => [response.data.data.comment, ...prev]);
         }
      }
      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      setDeleting(true);
      await postAPI.deletePost(post.id);
      onPostDeleted?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      setDeleting(false);
    }
  };

  if (deleting) {
    return (
      <div className="w-full max-w-[470px] bg-black border-b border-[#262626] pb-4 mb-4 text-sm mx-auto flex items-center justify-center py-12 text-gray-300">
        Deleting...
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* ── Comment Card Overlay ── */
        .cc-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: cc-fade-in 0.25s ease;
        }
        @keyframes cc-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .cc-card {
          background: rgba(18,18,18,0.96);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          width: 95%;
          max-width: 420px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
          animation: cc-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cc-slide-up {
          from { transform: translateY(40px) scale(0.97); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .cc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cc-header h3 {
          font-size: 14px;
          font-weight: 700;
          color: #f0f0f0;
          margin: 0;
        }
        .cc-close {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #999;
          transition: all 0.15s ease;
          padding: 0;
        }
        .cc-close:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        .cc-body {
          flex: 1;
          overflow-y: auto;
          padding: 8px 16px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .cc-body::-webkit-scrollbar { width: 4px; }
        .cc-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        .cc-comment {
          display: flex;
          gap: 10px;
          padding: 6px 0;
          animation: cc-comment-in 0.3s ease;
        }
        @keyframes cc-comment-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cc-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1a1a1a;
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .cc-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .cc-reply-avatar {
          width: 24px;
          height: 24px;
        }

        .cc-content {
          flex: 1;
          min-width: 0;
        }
        .cc-username {
          font-size: 13px;
          font-weight: 700;
          color: #e8e8e8;
          margin-right: 6px;
        }
        .cc-text {
          font-size: 13px;
          color: #b0b0b0;
          line-height: 1.45;
        }
        .cc-meta {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 4px;
        }
        .cc-time {
          font-size: 11px;
          color: #555;
          font-weight: 500;
        }
        .cc-reply-btn {
          background: none;
          border: none;
          font-size: 11px;
          color: #3b82f6;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.15s;
        }
        .cc-reply-btn:hover { opacity: 0.7; }

        .cc-view-replies {
          background: none;
          border: none;
          font-size: 11px;
          color: #3b82f6;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 0;
          margin-left: 42px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.15s;
        }
        .cc-view-replies:hover { opacity: 0.7; }
        .cc-view-replies-line {
          width: 24px;
          height: 0;
          border-bottom: 1px solid #444;
        }

        .cc-replies-list {
          margin-left: 42px;
          padding-top: 4px;
        }

        .cc-empty {
          text-align: center;
          padding: 40px 0;
          color: #555;
          font-size: 14px;
        }
        .cc-empty-title {
          font-size: 20px;
          font-weight: 300;
          color: #888;
          margin-bottom: 4px;
        }

        .cc-footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cc-replying-tag {
          font-size: 11px;
          color: #888;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 4px;
        }
        .cc-replying-cancel {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          padding: 0;
          line-height: 1;
          transition: color 0.15s;
        }
        .cc-replying-cancel:hover { color: #fff; }

        .cc-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 6px 12px;
          transition: border-color 0.2s ease;
        }
        .cc-input-row:focus-within {
          border-color: rgba(255,255,255,0.18);
        }
        .cc-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #f0f0f0;
          font-size: 13px;
          font-family: inherit;
        }
        .cc-input::placeholder { color: #555; }
        .cc-submit {
          background: none;
          border: none;
          color: #3b82f6;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          white-space: nowrap;
          transition: opacity 0.15s;
          font-family: inherit;
        }
        .cc-submit:hover { opacity: 0.7; }
        .cc-submit:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <div className="w-full max-w-[470px] bg-black border-b border-[#262626] pb-1 text-sm mx-auto overflow-hidden">
        {/* Post Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center space-x-2.5">
            <Link href={`/profile/${post.user_id || post.userId}`} className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[1.5px] cursor-pointer hover:opacity-80 transition-opacity duration-200">
              <div className="w-full h-full bg-black rounded-full border border-[#262626] flex items-center justify-center overflow-hidden">
                <span className="font-bold text-xs text-white">{post.username?.charAt(0).toUpperCase()}</span>
              </div>
            </Link>
            <div>
              <Link href={`/profile/${post.user_id || post.userId}`} className="font-semibold text-white hover:underline cursor-pointer transition-opacity duration-200 hover:opacity-80">
                {post.username}
              </Link>
              <span className="text-gray-400 text-xs ml-2">
                • {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 font-bold tracking-widest px-2 hover:opacity-50 transition-opacity duration-200">
              •••
            </button>
            {showMenu && (
              <div className={`absolute right-0 top-8 bg-[#262626] border border-[#363636] rounded-lg shadow-lg z-10 w-48 py-1 overflow-hidden transition-all duration-200 ease-in-out ${showMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                {isOwner && (
                  <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-red-500 font-semibold hover:bg-[#363636] text-sm transition-colors duration-200">
                    Delete
                  </button>
                )}
                <button onClick={() => setShowMenu(false)} className="w-full text-left px-4 py-3 hover:bg-[#363636] text-sm text-gray-300 transition-colors duration-200">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Media Area — Glassmorphism Card Stack Carousel */}
        {post.media_urls && post.media_urls.length > 0 ? (
          <MediaCarousel
            mediaUrls={post.media_urls}
            onDoubleTap={handleDoubleTap}
            showHeartAnimation={showHeartAnimation}
          />
        ) : (
          <div className="relative w-full aspect-square bg-black border-y border-[#262626] overflow-hidden">
            <div className="w-full h-full flex items-center justify-center text-[#555] bg-[#0a0a0a]">No Media</div>
          </div>
        )}

        {/* Post Actions */}
        <div className="px-3 pt-1.5 pb-1">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex space-x-3">
              <button onClick={handleLikeToggle} className="text-white hover:opacity-50 transition-opacity duration-200">
                {liked ? (
                  <svg aria-label="Unlike" fill="#ed4956" height="24" role="img" viewBox="0 0 48 48" width="24"><path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"></path></svg>
                ) : (
                  <svg aria-label="Like" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.118 1.763s.278-.588 1.118-1.763a4.21 4.21 0 0 1 3.675-1.941Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                )}
              </button>
              <button onClick={openCommentCard} className="text-white hover:opacity-50 transition-opacity duration-200">
                <svg aria-label="Comment" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </button>
            </div>
          </div>

          <div className="font-semibold text-white text-[13px]">{likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}</div>

          {post.caption && (
            <div className="text-white text-[13px] mt-0.5">
              <span className="font-semibold mr-1">{post.username}</span>
              <span className="text-[#e0e0e0]">{post.caption}</span>
            </div>
          )}

          {commentsCount > 0 && (
            <button onClick={openCommentCard} className="text-[#737373] text-[13px] mt-0.5 block hover:opacity-75 transition-opacity duration-200">
              View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}

          {/* Inline quick comment input */}
          <form onSubmit={handleAddComment} className="mt-1 flex items-center border-t border-[#262626] px-0 py-1.5 relative">
            <input
              type="text"
              placeholder="Add a comment..."
              className="w-full text-sm outline-none bg-transparent py-1 text-white placeholder-gray-500 font-medium"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            {commentText && (
              <button type="submit" className="text-blue-500 font-bold text-sm ml-2 whitespace-nowrap hover:opacity-70 transition-opacity duration-200" disabled={isSubmittingComment}>
                Post
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ── Comment Card Overlay (Instagram-style) ── */}
      {showCommentCard && (
        <div className="cc-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeCommentCard(); }}>
          <div className="cc-card">
            {/* Header */}
            <div className="cc-header">
              <h3>Comments</h3>
              <button className="cc-close" onClick={closeCommentCard}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Caption (shown at top like Instagram) */}
            {post.caption && (
              <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="cc-comment" style={{ padding: 0, animation: 'none' }}>
                  <div className="cc-avatar">
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#666' }}>{post.username?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="cc-content">
                    <span className="cc-username">{post.username}</span>
                    <span className="cc-text">{post.caption}</span>
                    <div className="cc-meta">
                      <span className="cc-time">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments body */}
            <div className="cc-body">
              {!commentsLoaded ? (
                <div className="cc-empty">
                  <div style={{ width: 24, height: 24, margin: '0 auto', borderRadius: '50%', border: '2px solid #333', borderTopColor: '#666', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : comments.length === 0 ? (
                <div className="cc-empty">
                  <div className="cc-empty-title">No comments yet</div>
                  <div>Start the conversation.</div>
                </div>
              ) : (
                comments.map((comment: any) => (
                  <div key={comment.id}>
                    <div className="cc-comment">
                      <div className="cc-avatar">
                        {comment.profile_picture_url ? (
                          <img src={comment.profile_picture_url} alt="" />
                        ) : (
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#666' }}>{comment.username?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="cc-content">
                        <span className="cc-username">{comment.username}</span>
                        <span className="cc-text">{comment.content}</span>
                        <div className="cc-meta">
                          <span className="cc-time">
                            {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <button className="cc-reply-btn" onClick={() => { setReplyingTo({ id: comment.id, username: comment.username }); commentInputRef.current?.focus(); }}>
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.reply_count > 0 && (
                      <>
                        <button className="cc-view-replies" onClick={() => loadReplies(comment.id)}>
                          <span className="cc-view-replies-line" />
                          {showRepliesFor[comment.id] ? 'Hide replies' : `View replies (${comment.reply_count})`}
                        </button>

                        {showRepliesFor[comment.id] && replies[comment.id] && (
                          <div className="cc-replies-list">
                            {replies[comment.id].map((reply: any) => (
                              <div key={reply.id} className="cc-comment">
                                <div className="cc-avatar cc-reply-avatar">
                                  {reply.profile_picture_url ? (
                                    <img src={reply.profile_picture_url} alt="" />
                                  ) : (
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#666' }}>{reply.username?.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="cc-content">
                                  <span className="cc-username">{reply.username}</span>
                                  <span className="cc-text">{reply.content}</span>
                                  <div className="cc-meta">
                                    <span className="cc-time">
                                      {new Date(reply.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer — comment input */}
            <div className="cc-footer">
              {replyingTo && (
                <div className="cc-replying-tag">
                  Replying to <span style={{ color: '#3b82f6', fontWeight: 600 }}>{replyingTo.username}</span>
                  <button className="cc-replying-cancel" onClick={() => setReplyingTo(null)}>×</button>
                </div>
              )}
              <form onSubmit={handleAddComment} className="cc-input-row">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : 'Add a comment...'}
                  className="cc-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                {commentText && (
                  <button type="submit" className="cc-submit" disabled={isSubmittingComment}>
                    Post
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
