import { commentsService } from '../../services/comments';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Comments Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getComments', () => {
    test('fetches comments for a post', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { comments: [], total: 0 } }
      });

      await commentsService.getComments(1);

      expect(api.get).toHaveBeenCalledWith('/posts/1/comments', {
        params: { page: 1, limit: 20 }
      });
    });
  });

  describe('addComment', () => {
    test('adds a comment to a post', async () => {
      api.post.mockResolvedValue({
        data: { success: true, data: { id: 1, content: 'Test' } }
      });

      await commentsService.addComment(1, { content: 'Test comment' });

      expect(api.post).toHaveBeenCalledWith('/posts/1/comments', {
        content: 'Test comment'
      });
    });

    test('adds a reply with parent_id', async () => {
      api.post.mockResolvedValue({
        data: { success: true, data: { id: 2 } }
      });

      await commentsService.addComment(1, {
        content: 'Reply',
        parent_id: 5,
        mentions: [3]
      });

      expect(api.post).toHaveBeenCalledWith('/posts/1/comments', {
        content: 'Reply',
        parent_id: 5,
        mentions: [3]
      });
    });
  });

  describe('likeComment', () => {
    test('likes a comment', async () => {
      api.post.mockResolvedValue({ data: { success: true } });

      await commentsService.likeComment(1);

      expect(api.post).toHaveBeenCalledWith('/comments/1/like');
    });
  });
});
