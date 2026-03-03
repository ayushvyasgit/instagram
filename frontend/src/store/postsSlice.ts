import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  user_id: string;
}

interface PostsState {
  feedPosts: Post[];
  feedPage: number;
  feedHasMore: boolean;
  feedTotal: number;
  feedLoading: boolean;
  feedLoadingMore: boolean;

  userPosts: Post[];
  userPostsPage: number;
  userPostsHasMore: boolean;
  userPostsTotal: number;
  userPostsLoading: boolean;
}

const initialState: PostsState = {
  feedPosts: [],
  feedPage: 1,
  feedHasMore: true,
  feedTotal: 0,
  feedLoading: false,
  feedLoadingMore: false,

  userPosts: [],
  userPostsPage: 1,
  userPostsHasMore: true,
  userPostsTotal: 0,
  userPostsLoading: false,
};

export const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // Feed Reducers
    setFeedPosts: (
      state,
      action: PayloadAction<{ posts: Post[]; total: number; hasMore: boolean }>
    ) => {
      state.feedPosts = action.payload.posts;
      state.feedTotal = action.payload.total;
      state.feedHasMore = action.payload.hasMore;
      state.feedPage = 1;
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
    
    // User Posts Reducers
    setUserPosts: (
      state,
      action: PayloadAction<Post[]>
    ) => {
      state.userPosts = action.payload;
      state.userPostsLoading = false;
    },
    setUserPostsLoading: (state, action: PayloadAction<boolean>) => {
      state.userPostsLoading = action.payload;
    },

    // Global Post Actions
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
  setFeedPosts,
  appendFeedPosts,
  setFeedLoading,
  setFeedLoadingMore,
  setUserPosts,
  setUserPostsLoading,
  removePost,
  updatePostLikes,
  incrementCommentCount,
} = postsSlice.actions;

export default postsSlice.reducer;
