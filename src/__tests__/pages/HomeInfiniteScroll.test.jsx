import React from 'react';
import { render, waitFor } from '@testing-library/react';
import Home from '../../pages/Home';
import { postsService } from '../../services/posts';

jest.mock('../../services/posts', () => ({
  postsService: {
    getPosts: jest.fn(),
    getTags: jest.fn(),
  },
}));

describe('Home (infinite scroll baseline)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initial load calls getPosts with page 0', async () => {
    postsService.getTags.mockResolvedValue([{ name: 'tag1' }]);
    postsService.getPosts.mockResolvedValue({
      data: [],
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
});
