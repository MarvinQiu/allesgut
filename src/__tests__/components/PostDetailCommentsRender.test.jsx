import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostDetail from '../../components/PostDetail';

jest.mock('../../services/comments', () => ({
  commentsService: {
    getComments: jest.fn(),
    addComment: jest.fn()
  }
}));

jest.mock('../../services/posts', () => ({ postsService: {} }));
jest.mock('../../services/users', () => ({ usersService: {} }));

const { commentsService } = require('../../services/comments');

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
});
