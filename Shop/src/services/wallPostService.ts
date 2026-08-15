import { api } from './api';

export interface WallPostAuthor {
  id: string;
  name: string;
  username: string;
  profilePicture: string | null;
}

export interface WallPostComment {
  id: string;
  content: string;
  createdAt: string;
  author: WallPostAuthor;
}

export interface WallPost {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  likesCount: number;
  likedByMe: boolean;
  comments: WallPostComment[];
}

export const getWallPosts = async (username: string) => {
  const { data } = await api.get<{ posts: WallPost[] }>(`/users/${username}/wall`);
  return data.posts;
};

export const createWallPost = async (content: string) => {
  const { data } = await api.post<{ post: WallPost }>('/users/wall', { content });
  return data.post;
};

export const deleteWallPost = async (postId: string) => {
  const { data } = await api.delete<{ deleted: boolean }>(`/users/wall/${postId}`);
  return data.deleted;
};

export const togglePin = async (postId: string) => {
  const { data } = await api.patch<{ post: WallPost }>(`/users/wall/${postId}/pin`);
  return data.post;
};

export const toggleLike = async (postId: string) => {
  const { data } = await api.post<{ post: WallPost }>(`/users/wall/${postId}/like`);
  return data.post;
};

export const addComment = async (postId: string, content: string) => {
  const { data } = await api.post<{ post: WallPost }>(`/users/wall/${postId}/comments`, { content });
  return data.post;
};