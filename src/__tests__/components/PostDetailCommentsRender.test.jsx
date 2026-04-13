import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostDetail from '../../components/PostDetail';

jest.mock('../../services/comments', () => ({
  commentsService: {
    getComments: jest.fn(),
    addComment: jest.fn()
  }
}));

jest.mock('../../services/posts', () => ({
  postsService: {
    favoritePost: jest.fn().mockResolvedValue({}),
    unfavoritePost: jest.fn().mockResolvedValue({}),
    likePost: jest.fn().mockResolvedValue({}),
    unlikePost: jest.fn().mockResolvedValue({}),
  }
}));
jest.mock('../../services/users', () => ({
  usersService: {
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
  }
}));

jest.mock('../../hooks/useAuthGate', () => ({
  __esModule: true,
  default: () => ({
    // In product UX, unauthenticated actions are disabled/hidden.
    // For tests that still exercise handlers, default to allowing the action.
    requireAuth: (action) => action(),
  }),
}));

const mockUseAuth = jest.fn(() => ({ isAuthenticated: true }));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

const { commentsService } = require('../../services/comments');
const { usersService } = require('../../services/users');
const { postsService } = require('../../services/posts');

describe('PostDetail comments', () => {
  test('renders comment author from nested author object', async () => {
    commentsService.getComments.mockResolvedValue({
      data: [
        {
          id: 'c1',
          author: {
            id: 'u1',
            phone: '138****8000',
            nickname: 'Alice',
            avatarUrl: null,
            bio: null,
            postsCount: 0,
            followersCount: 0,
            followingCount: 0
          },
          content: 'Hello',
          createdAt: '2026-02-25T11:00:00'
        }
      ]
    });

    const post = {
      id: 'p1',
      title: 'T',
      content: 'C',
      author: 'Someone',
      avatar: 'https://example.com/a.png',
      time: 'now',
      likes: 0,
      comments: 1,
      favorites: 0,
      images: ['https://example.com/i.png'],
      author_id: 'u1'
    };

    render(<PostDetail post={post} onClose={() => {}} />);

    fireEvent.click(screen.getByLabelText('查看评论'));

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(await screen.findByText('Hello')).toBeInTheDocument();
  });

  test('initializes follow state from author_is_followed', async () => {
    commentsService.getComments.mockResolvedValue({ data: [] });

    const post = {
      id: 'p1',
      title: 'T',
      content: 'C',
      author: 'Someone',
      avatar: 'https://example.com/a.png',
      time: 'now',
      likes: 0,
      comments: 0,
      favorites: 0,
      images: ['https://example.com/i.png'],
      author_is_followed: true,
    };

    render(<PostDetail post={post} onClose={() => {}} />);

    expect(await screen.findByText('已关注')).toBeInTheDocument();
  });

  test('disables follow button when unauthenticated', async () => {
    commentsService.getComments.mockResolvedValue({ data: [] });

    const post = {
      id: 'p1',
      title: 'T',
      content: 'C',
      author: 'Someone',
      avatar: 'https://example.com/a.png',
      time: 'now',
      likes: 0,
      comments: 0,
      favorites: 0,
      images: ['https://example.com/i.png'],
      _original: { author: { id: 'u-123' } }
    };

    mockUseAuth.mockReturnValueOnce({ isAuthenticated: false });

    render(<PostDetail post={post} onClose={() => {}} />);

    const followButton = screen.getByText('关注').closest('button');
    expect(followButton).toBeDisabled();

    fireEvent.click(screen.getByText('关注'));
    expect(usersService.followUser).not.toHaveBeenCalled();
  });

  test('disables like and favorite buttons when unauthenticated', async () => {
    commentsService.getComments.mockResolvedValue({ data: [] });

    const post = {
      id: 'p1',
      title: 'T',
      content: 'C',
      author: 'Someone',
      avatar: 'https://example.com/a.png',
      time: 'now',
      likes: 3,
      comments: 0,
      favorites: 2,
      images: ['https://example.com/i.png'],
      author_id: 'u1',
    };

    mockUseAuth.mockReturnValueOnce({ isAuthenticated: false });

    render(<PostDetail post={post} onClose={() => {}} />);

    const likeButton = screen.getByLabelText('点赞');
    const favoriteButton = screen.getByLabelText('收藏');

    expect(likeButton).toBeDisabled();
    expect(favoriteButton).toBeDisabled();

    fireEvent.click(likeButton);
    fireEvent.click(favoriteButton);

    expect(postsService.likePost).not.toHaveBeenCalled();
    expect(postsService.favoritePost).not.toHaveBeenCalled();
  });

  test('favorites count updates optimistically after toggling', async () => {
    commentsService.getComments.mockResolvedValue({ data: [] });
    postsService.favoritePost.mockResolvedValue({});

    const post = {
      id: 'p1',
      title: 'T',
      content: 'C',
      author: 'Someone',
      avatar: 'https://example.com/a.png',
      time: 'now',
      likes: 0,
      comments: 0,
      favorites: 5,
      is_favorited: false,
      images: ['https://example.com/i.png'],
      author_id: 'u1',
    };

    render(<PostDetail post={post} onClose={() => {}} />);

    // Initially shows 5
    const favoriteButton = screen.getByLabelText('收藏');
    expect(favoriteButton.closest('button').textContent).toContain('5');

    // Click favorite
    fireEvent.click(favoriteButton);

    // Count should update to 6
    await waitFor(() => {
      expect(favoriteButton.closest('button').textContent).toContain('6');
    });
  });
});
