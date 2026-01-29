import api from './api';

// Helper function to format time
function formatTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}天前`;

  return date.toLocaleDateString('zh-CN');
}

export const postsService = {
  async getPosts({ page = 1, limit = 20, feed_type = 'recommended', tag, search } = {}) {
    const params = { page: page - 1, limit, feedType: feed_type };
    if (tag) params.tag = tag;
    if (search) params.search = search;

    const response = await api.get('/posts', { params });
    const result = response.data.data;

    // Transform backend format to frontend format
    if (result.data) {
      result.data = result.data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        author: post.author?.nickname || 'Unknown',
        avatar: post.author?.avatarUrl || 'https://via.placeholder.com/100',
        image: post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null,
        images: post.mediaUrls || [],
        tags: post.tags || [],
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        time: formatTime(post.createdAt),
        // Keep original fields for detail view
        _original: post
      }));
    }

    return result;
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
