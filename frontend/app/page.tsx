'use client';

import { useEffect, useState } from 'react';
import { postAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Post {
  id: string;
  caption: string;
  media_urls: string[];
  like_count: number;
  comment_count: number;
  username: string;
  profile_picture_url?: string;
  user_liked: boolean;
  created_at: string;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadFeed();
  }, [isAuthenticated, page]);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getFeed(page, 20);
      setPosts(response.data.data.posts);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Feed</h1>
      
      <div className="space-y-8">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Post Header */}
            <div className="flex items-center p-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
              <div>
                <p className="font-semibold">{post.username}</p>
                <p className="text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Post Image */}
            {post.media_urls[0] && (
              <div className="relative w-full h-96">
                <Image
                  src={post.media_urls[0]}
                  alt={post.caption || 'Post image'}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Post Actions */}
            <div className="p-4">
              <div className="flex space-x-4 mb-3">
                <button className="hover:text-red-500">
                  ❤️ {post.like_count}
                </button>
                <button>💬 {post.comment_count}</button>
                <button>📤</button>
              </div>

              {/* Caption */}
              {post.caption && (
                <p className="text-sm">
                  <span className="font-semibold mr-2">{post.username}</span>
                  {post.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {posts.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(page + 1)}
            className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}