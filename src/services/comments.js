import api from './api';

export const commentsService = {
  async getComments(postId, { page = 1, limit = 20 } = {}) {
    const response = await api.get(`/posts/${postId}/comments`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  async addComment(postId, { content, parent_id, mentions }) {
    const data = { content };
    if (parent_id) data.parent_id = parent_id;
    if (mentions?.length) data.mentions = mentions;

    const response = await api.post(`/posts/${postId}/comments`, data);
    return response.data.data;
  },

  async deleteComment(commentId) {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  async likeComment(commentId) {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },

  async unlikeComment(commentId) {
    const response = await api.delete(`/comments/${commentId}/like`);
    return response.data;
  }
};
