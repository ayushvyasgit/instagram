'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { likeAPI, commentAPI, postAPI } from '@/src/lib/api';

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
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [showRepliesFor, setShowRepliesFor] = useState<Record<string, boolean>>({});
  const lastTapRef = useRef<number>(0);

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

  const loadComments = async () => {
    if (commentsLoaded) {
      setShowAllComments(!showAllComments);
      return;
    }
    try {
      const response = await commentAPI.getPostComments(post.id, 1, 20);
      setComments(response.data.data.comments);
      setCommentsLoaded(true);
      setShowAllComments(true);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

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
         
         // Update state count directly to reflect immediate UI change
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
      <div className="w-full max-w-[470px] bg-white border-b border-gray-200 pb-4 mb-4 text-sm mx-auto flex items-center justify-center py-12 text-black">
        Deleting...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[470px] bg-white border-b border-gray-200 pb-4 mb-4 text-sm mx-auto">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          <Link href={`/profile/${post.user_id || post.userId}`} className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px] cursor-pointer hover:opacity-80">
            <div className="w-full h-full bg-white rounded-full border border-gray-200 flex items-center justify-center overflow-hidden">
              <span className="font-bold text-xs text-black">{post.username?.charAt(0).toUpperCase()}</span>
            </div>
          </Link>
          <div>
            <Link href={`/profile/${post.user_id || post.userId}`} className="font-semibold text-black hover:underline cursor-pointer">
              {post.username}
            </Link>
            <span className="text-black text-xs ml-2">
              • {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-black font-bold tracking-widest px-2 hover:opacity-50">
            •••
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48 py-1 overflow-hidden">
              {isOwner && (
                <button onClick={handleDelete} className="w-full text-left px-4 py-3 text-red-500 font-semibold hover:bg-gray-50 text-sm">
                  Delete
                </button>
              )}
              <button onClick={() => setShowMenu(false)} className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-black">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Media Area */}
      <div className="relative w-full aspect-square bg-gray-100 rounded-sm border border-gray-200 overflow-hidden cursor-pointer select-none" onClick={handleDoubleTap}>
        {post.media_urls && post.media_urls[0] ? (
          <Image src={post.media_urls[0]} alt="" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black">No Media</div>
        )}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <svg className="animate-ping" fill="white" height="80" viewBox="0 0 48 48" width="80" style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' }}>
              <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-3 pb-2 pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-4">
            <button onClick={handleLikeToggle} className="text-black hover:opacity-50 transition-opacity">
              {liked ? (
                <svg aria-label="Unlike" fill="#ff3040" height="24" role="img" viewBox="0 0 48 48" width="24"><path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"></path></svg>
              ) : (
                <svg aria-label="Like" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.118 1.763s.278-.588 1.118-1.763a4.21 4.21 0 0 1 3.675-1.941Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              )}
            </button>
            <button onClick={loadComments} className="text-black hover:opacity-50 transition-opacity">
              <svg aria-label="Comment" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
          </div>
        </div>

        <div className="font-semibold mb-1 text-black">{likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}</div>

        {post.caption && (
          <div className="mb-1 text-black">
            <span className="font-semibold mr-1">{post.username}</span>
            <span>{post.caption}</span>
          </div>
        )}

        {commentsCount > 0 && !showAllComments && (
          <button onClick={loadComments} className="text-gray-700 font-medium mb-1 block hover:opacity-75">
            View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {showAllComments && commentsLoaded && (
          <div className="mt-2 space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
            {comments.map((comment: any) => (
              <div key={comment.id} className="flex flex-col">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-300">
                    {comment.profile_picture_url ? (
                      <img src={comment.profile_picture_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-black font-bold">{comment.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="font-semibold mr-2 text-black">{comment.username}</span>
                    <span className="text-black">{comment.content}</span>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-black font-medium text-opacity-80">
                        {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <button onClick={() => setReplyingTo({ id: comment.id, username: comment.username })} className="text-xs text-black font-bold hover:opacity-70">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {comment.reply_count > 0 && (
                   <div className="ml-10 mt-1">
                     <button onClick={() => loadReplies(comment.id)} className="text-xs text-black font-bold flex items-center gap-2 hover:opacity-70">
                       <div className="w-8 border-b border-black h-0 opacity-50"></div>
                       {showRepliesFor[comment.id] ? 'Hide replies' : `View replies (${comment.reply_count})`}
                     </button>
                     
                     {showRepliesFor[comment.id] && replies[comment.id] && (
                       <div className="mt-3 space-y-3">
                         {replies[comment.id].map((reply: any) => (
                           <div key={reply.id} className="flex items-start gap-2">
                             <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-300">
                               {reply.profile_picture_url ? (
                                 <img src={reply.profile_picture_url} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <span className="text-[10px] text-black font-bold">{reply.username?.charAt(0).toUpperCase()}</span>
                               )}
                             </div>
                             <div className="flex-1 text-sm text-black">
                               <span className="font-semibold mr-2">{reply.username}</span>
                               <span>{reply.content}</span>
                               <div className="flex items-center gap-4 mt-1">
                                 <span className="text-xs text-black font-medium text-opacity-80">
                                   {new Date(reply.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                 </span>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                )}
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-black text-xs text-center py-2">No comments yet.</p>
            )}
          </div>
        )}

        <form onSubmit={handleAddComment} className="mt-2 flex items-center border-[1.5px] border-gray-300 rounded-full px-4 py-2 relative bg-gray-50">
          {replyingTo && (
            <div className="absolute -top-7 left-2 bg-gray-200 text-black text-xs px-3 py-1 rounded-md flex items-center gap-2 font-medium shadow-sm">
              Replying to {replyingTo.username}
              <button type="button" onClick={() => setReplyingTo(null)} className="font-bold ml-2 hover:opacity-70">×</button>
            </div>
          )}
          <input
            type="text"
            placeholder={replyingTo ? `Add a reply...` : "Add a comment..."}
            className="w-full text-sm outline-none bg-transparent py-1 text-black placeholder-gray-600 font-medium"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          {commentText && (
            <button type="submit" className="text-[#0095f6] font-bold text-sm ml-2 whitespace-nowrap" disabled={isSubmittingComment}>
              Post
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
