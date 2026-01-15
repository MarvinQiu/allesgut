import api from './api';

export const usersService = {
  async getUser(id) {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  async updateProfile(data) {
    const response = await api.put('/users/me', data);
    return response.data.data;
  },

  async followUser(id) {
    const response = await api.post(`/users/${id}/follow`);
    return response.data;
  },

  async unfollowUser(id) {
    const response = await api.delete(`/users/${id}/follow`);
    return response.data;
  },

  async getFollowers(id, { page = 1, limit = 20 } = {}) {
    const response = await api.get(`/users/${id}/followers`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  async getFollowing(id, { page = 1, limit = 20 } = {}) {
    const response = await api.get(`/users/${id}/following`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  async getUserPosts(id, { page = 1, limit = 20 } = {}) {
    const response = await api.get(`/users/${id}/posts`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  async getMyFavorites({ page = 1, limit = 20 } = {}) {
    const response = await api.get('/users/me/favorites', {
      params: { page, limit }
    });
    return response.data.data;
  },

  async blockUser(id) {
    const response = await api.post(`/users/${id}/block`);
    return response.data;
  },

  async unblockUser(id) {
    const response = await api.delete(`/users/${id}/block`);
    return response.data;
  },

  async searchUsers(query, { page = 1, limit = 20 } = {}) {
    const response = await api.get('/users/search', {
      params: { q: query, page, limit }
    });
    return response.data.data;
  }
};
