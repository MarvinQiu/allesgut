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
    test('uses 0-based paging by default (page=0)', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { posts: [], total: 0 } }
      });

      await postsService.getPosts();

      expect(api.get).toHaveBeenCalledWith('/posts', {
        params: { page: 0, limit: 20, feedType: 'recommended' }
      });
    });

    test('passes through custom params (page is 0-based)', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { posts: [], total: 0 } }
      });

      await postsService.getPosts({ page: 1, feed_type: 'following', tag: '自闭症' });

      expect(api.get).toHaveBeenCalledWith('/posts', {
        params: { page: 1, limit: 20, feedType: 'following', tag: '自闭症' }
      });
    });

    test('clamps negative page to 0', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { posts: [], total: 0 } }
      });

      await postsService.getPosts({ page: -5, feed_type: 'recommended' });

      expect(api.get).toHaveBeenCalledWith('/posts', {
        params: { page: 0, limit: 20, feedType: 'recommended' }
      });
    });
  });

  describe('getPost', () => {
    test('fetches single post by id (and normalizes mediaUrls)', async () => {
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: 1,
            title: 'Test',
            content: 'Body',
            author: { nickname: 'A', avatarUrl: 'https://example.com/a.png' },
            mediaUrls: ['https://example.com/1.png', 'https://example.com/2.png'],
            tags: ['t1'],
            likesCount: 1,
            commentsCount: 2,
            createdAt: '2026-01-01T00:00:00Z'
          }
        }
      });

      const result = await postsService.getPost(1);

      expect(api.get).toHaveBeenCalledWith('/posts/1');
      expect(result.image).toBe('https://example.com/1.png');
      expect(result.images).toEqual(['https://example.com/1.png', 'https://example.com/2.png']);
    });
  });

  describe('createPost', () => {
    test('creates post with data (and normalizes mediaUrls)', async () => {
      api.post.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: 1,
            title: 'Test',
            content: 'Content',
            author: { nickname: 'A', avatarUrl: 'https://example.com/a.png' },
            mediaUrls: ['https://example.com/1.png'],
            tags: ['tag1'],
            likesCount: 0,
            commentsCount: 0,
            createdAt: '2026-01-01T00:00:00Z'
          }
        }
      });

      const postData = { title: 'Test', content: 'Content', tags: ['tag1'] };
      const created = await postsService.createPost(postData);

      expect(api.post).toHaveBeenCalledWith('/posts', postData);
      expect(created.image).toBe('https://example.com/1.png');
      expect(created.images).toEqual(['https://example.com/1.png']);
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
