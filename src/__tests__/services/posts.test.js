import { postsService } from '../../services/posts';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Posts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    test('fetches posts with default params', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { posts: [], total: 0 } }
      });

      await postsService.getPosts();

      expect(api.get).toHaveBeenCalledWith('/posts', {
        params: { page: 1, limit: 20, feed_type: 'recommended' }
      });
    });

    test('fetches posts with custom params', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { posts: [], total: 0 } }
      });

      await postsService.getPosts({ page: 2, feed_type: 'following', tag: '自闭症' });

      expect(api.get).toHaveBeenCalledWith('/posts', {
        params: { page: 2, limit: 20, feed_type: 'following', tag: '自闭症' }
      });
    });
  });

  describe('getPost', () => {
    test('fetches single post by id', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { id: 1, title: 'Test' } }
      });

      const result = await postsService.getPost(1);

      expect(api.get).toHaveBeenCalledWith('/posts/1');
      expect(result).toEqual({ id: 1, title: 'Test' });
    });
  });

  describe('createPost', () => {
    test('creates post with data', async () => {
      api.post.mockResolvedValue({
        data: { success: true, data: { id: 1 } }
      });

      const postData = { title: 'Test', content: 'Content', tags: ['tag1'] };
      await postsService.createPost(postData);

      expect(api.post).toHaveBeenCalledWith('/posts', postData);
    });
  });

  describe('likePost', () => {
    test('likes a post', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await postsService.likePost(1);

      expect(api.post).toHaveBeenCalledWith('/posts/1/like');
    });
  });

  describe('unlikePost', () => {
    test('unlikes a post', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      await postsService.unlikePost(1);

      expect(api.delete).toHaveBeenCalledWith('/posts/1/like');
    });
  });
});
