import api from './api';

export const postsService = {
  async getPosts({ page = 1, limit = 20, feed_type = 'recommended', tag, search } = {}) {
    const params = { page, limit, feed_type };
    if (tag) params.tag = tag;
    if (search) params.search = search;

    const response = await api.get('/posts', { params });
    return response.data.data;
  },

  async getPost(id) {
    const response = await api.get(`/posts/${id}`);
    return response.data.data;
  },

  async createPost(data) {
    const response = await api.post('/posts', data);
    return response.data.data;
  },

  async updatePost(id, data) {
    const response = await api.put(`/posts/${id}`, data);
    return response.data.data;
  },

  async deletePost(id) {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  async likePost(id) {
    const response = await api.post(`/posts/${id}/like`);
    return response.data;
  },

  async unlikePost(id) {
    const response = await api.delete(`/posts/${id}/like`);
    return response.data;
  },

  async favoritePost(id) {
    const response = await api.post(`/posts/${id}/favorite`);
    return response.data;
  },

  async unfavoritePost(id) {
    const response = await api.delete(`/posts/${id}/favorite`);
    return response.data;
  },

  async getTags() {
    const response = await api.get('/tags');
    return response.data.data;
  }
};
