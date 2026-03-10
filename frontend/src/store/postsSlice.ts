import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Post {
  id: string;
  caption: string;
  media_urls: string[];
  media_type?: 'image' | 'video' | 'carousel';
  like_count: number;
  comment_count: number;
  username: string;
  profile_picture_url?: string;
  user_liked: boolean;
  created_at: string;
  user_id: string;
}

interface PostsState {
  feedPosts: Post[];
  feedPage: number;
  feedHasMore: boolean;
  feedTotal: number;
  feedLoading: boolean;
  feedLoadingMore: boolean;

  // ── Cursor pagination state (added alongside existing offset state) ──
  feedNextCursor: string | null;   // pass with direction=next to get older posts
  feedPrevCursor: string | null;   // pass with direction=prev to get newer posts
  feedHasNextPage: boolean;
  feedHasPreviousPage: boolean;

  userPosts: Post[];
  userPostsPage: number;
  userPostsHasMore: boolean;
  userPostsTotal: number;
  userPostsLoading: boolean;
  userPostsLoadingMore: boolean;

  // ── Cursor pagination state for user posts ──
  userPostsNextCursor: string | null;
  userPostsPrevCursor: string | null;
  userPostsHasNextPage: boolean;
  userPostsHasPreviousPage: boolean;
}

const initialState: PostsState = {
  feedPosts: [],
  feedPage: 1,
  feedHasMore: true,
  feedTotal: 0,
  feedLoading: false,
  feedLoadingMore: false,

  feedNextCursor: null,
  feedPrevCursor: null,
  feedHasNextPage: false,
  feedHasPreviousPage: false,

  userPosts: [],
  userPostsPage: 1,
  userPostsHasMore: true,
  userPostsTotal: 0,
  userPostsLoading: false,
  userPostsLoadingMore: false,

  userPostsNextCursor: null,
  userPostsPrevCursor: null,
  userPostsHasNextPage: false,
  userPostsHasPreviousPage: false,
};

export const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // ── Existing feed reducers (UNCHANGED) ────────────────────────────────────

    setFeedPosts: (
      state,
      action: PayloadAction<{ posts: Post[]; total: number; hasMore: boolean; page?: number }>
    ) => {
      state.feedPosts = action.payload.posts;
      state.feedTotal = action.payload.total;
      state.feedHasMore = action.payload.hasMore;
      state.feedPage = action.payload.page || 1;
      state.feedLoading = false;
    },
    appendFeedPosts: (
      state,
      action: PayloadAction<{ posts: Post[]; total: number; hasMore: boolean; page: number }>
    ) => {
      const existingIds = new Set(state.feedPosts.map((p) => p.id));
      const newPosts = action.payload.posts.filter((p) => !existingIds.has(p.id));
      state.feedPosts = [...state.feedPosts, ...newPosts];
      state.feedTotal = action.payload.total;
      state.feedHasMore = action.payload.hasMore;
      state.feedPage = action.payload.page;
      state.feedLoadingMore = false;
    },
    setFeedLoading: (state, action: PayloadAction<boolean>) => {
      state.feedLoading = action.payload;
    },
    setFeedLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.feedLoadingMore = action.payload;
    },

    // ── NEW: cursor-based feed reducers ───────────────────────────────────────

    /**
     * Replace the current feed page with cursor-fetched posts (initial load / refresh).
     */
    setFeedPostsCursor: (
      state,
      action: PayloadAction<{
        posts: Post[];
        nextCursor: string | null;
        prevCursor: string | null;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      }>
    ) => {
      state.feedPosts = action.payload.posts;
      state.feedNextCursor = action.payload.nextCursor;
      state.feedPrevCursor = action.payload.prevCursor;
      state.feedHasNextPage = action.payload.hasNextPage;
      state.feedHasPreviousPage = action.payload.hasPreviousPage;
      state.feedLoading = false;
    },

    /**
     * Append cursor-fetched posts to the existing feed (infinite scroll).
     */
    appendFeedPostsCursor: (
      state,
      action: PayloadAction<{
        posts: Post[];
        nextCursor: string | null;
        prevCursor: string | null;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      }>
    ) => {
      const existingIds = new Set(state.feedPosts.map((p) => p.id));
      const newPosts = action.payload.posts.filter((p) => !existingIds.has(p.id));
      state.feedPosts = [...state.feedPosts, ...newPosts];
      state.feedNextCursor = action.payload.nextCursor;
      state.feedPrevCursor = action.payload.prevCursor;
      state.feedHasNextPage = action.payload.hasNextPage;
      state.feedHasPreviousPage = action.payload.hasPreviousPage;
    },

    // ── Existing user post reducers (UNCHANGED) ───────────────────────────────

    setUserPosts: (
      state,
      action: PayloadAction<{ posts: Post[]; total: number; hasMore: boolean }>
    ) => {
      state.userPosts = action.payload.posts;
      state.userPostsTotal = action.payload.total;
      state.userPostsHasMore = action.payload.hasMore;
      state.userPostsPage = 1;
      state.userPostsLoading = false;
    },
    appendUserPosts: (
      state,
      action: PayloadAction<{ posts: Post[]; total: number; hasMore: boolean; page: number }>
    ) => {
      const existingIds = new Set(state.userPosts.map((p) => p.id));
      const newPosts = action.payload.posts.filter((p) => !existingIds.has(p.id));
      state.userPosts = [...state.userPosts, ...newPosts];
      state.userPostsTotal = action.payload.total;
      state.userPostsHasMore = action.payload.hasMore;
      state.userPostsPage = action.payload.page;
      state.userPostsLoadingMore = false;
    },
    setUserPostsLoading: (state, action: PayloadAction<boolean>) => {
      state.userPostsLoading = action.payload;
    },
    setUserPostsLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.userPostsLoadingMore = action.payload;
    },

    // ── NEW: cursor-based user posts reducer ──────────────────────────────────

    setUserPostsCursor: (
      state,
      action: PayloadAction<{
        posts: Post[];
        nextCursor: string | null;
        prevCursor: string | null;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      }>
    ) => {
      state.userPosts = action.payload.posts;
      state.userPostsNextCursor = action.payload.nextCursor;
      state.userPostsPrevCursor = action.payload.prevCursor;
      state.userPostsHasNextPage = action.payload.hasNextPage;
      state.userPostsHasPreviousPage = action.payload.hasPreviousPage;
      state.userPostsLoading = false;
    },

    // ── Global post actions (UNCHANGED) ──────────────────────────────────────

    removePost: (state, action: PayloadAction<string>) => {
      state.feedPosts = state.feedPosts.filter((p) => p.id !== action.payload);
      state.userPosts = state.userPosts.filter((p) => p.id !== action.payload);
    },
    updatePostLikes: (
      state,
      action: PayloadAction<{ postId: string; liked: boolean; offset: number }>
    ) => {
      const { postId, liked, offset } = action.payload;
      const feedPost = state.feedPosts.find((p) => p.id === postId);
      if (feedPost) {
        feedPost.user_liked = liked;
        feedPost.like_count += offset;
      }
      const userPost = state.userPosts.find((p) => p.id === postId);
      if (userPost) {
        userPost.user_liked = liked;
        userPost.like_count += offset;
      }
    },
    incrementCommentCount: (state, action: PayloadAction<string>) => {
      const feedPost = state.feedPosts.find((p) => p.id === action.payload);
      if (feedPost) feedPost.comment_count += 1;
      const userPost = state.userPosts.find((p) => p.id === action.payload);
      if (userPost) userPost.comment_count += 1;
    },
  },
});

export const {
  // existing — all preserved
  setFeedPosts,
  appendFeedPosts,
  setFeedLoading,
  setFeedLoadingMore,
  setUserPosts,
  appendUserPosts,
  setUserPostsLoading,
  setUserPostsLoadingMore,
  removePost,
  updatePostLikes,
  incrementCommentCount,
  // new cursor actions
  setFeedPostsCursor,
  appendFeedPostsCursor,
  setUserPostsCursor,
} = postsSlice.actions;

export default postsSlice.reducer;