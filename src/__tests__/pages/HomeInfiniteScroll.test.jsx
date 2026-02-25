import React, { act } from 'react';
import { render, waitFor } from '@testing-library/react';
import Home from '../../pages/Home/index.jsx';
import { postsService } from '../../services/posts';

jest.mock('../../services/posts', () => ({
  postsService: {
    getPosts: jest.fn(),
    getTags: jest.fn(),
  },
}));

describe('Home (infinite scroll)', () => {
  let ioCallback;

  beforeEach(() => {
    jest.clearAllMocks();

    ioCallback = undefined;
    global.IntersectionObserver = jest.fn((callback) => {
      ioCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });
  });

  test('initial load calls getPosts with page 0', async () => {
    postsService.getTags.mockResolvedValue([{ name: 'tag1' }]);
    postsService.getPosts.mockResolvedValue({
      data: [],
      page: 0,
      totalPages: 1,
    });

    render(<Home />);

    await waitFor(() => {
      expect(postsService.getPosts).toHaveBeenCalled();
    });

    expect(postsService.getPosts).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 0,
      })
    );
  });

  test('loads next page when sentinel intersects', async () => {
    postsService.getTags.mockResolvedValue([{ name: 'tag1' }]);

    postsService.getPosts
      .mockResolvedValueOnce({
        data: [{ id: 'p0', title: 'p0' }],
        page: 0,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'p1', title: 'p1' }],
        page: 1,
        totalPages: 2,
      });

    render(<Home />);

    await waitFor(() => expect(postsService.getPosts).toHaveBeenCalledTimes(1));

    // Simulate sentinel intersection
    await waitFor(() => expect(ioCallback).toBeDefined());
    act(() => {
      ioCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => expect(postsService.getPosts).toHaveBeenCalledTimes(2));

    expect(postsService.getPosts).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ page: 0 })
    );
    expect(postsService.getPosts).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ page: 1 })
    );
  });
});
