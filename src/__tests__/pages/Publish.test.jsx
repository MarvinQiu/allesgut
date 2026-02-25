import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import Publish from '../../pages/Publish';
import { postsService } from '../../services/posts';
import { uploadService } from '../../services/upload';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('../../services/posts', () => ({
  postsService: {
    getTags: jest.fn(),
    createPost: jest.fn(),
  },
}));

jest.mock('../../services/upload', () => ({
  uploadService: {
    uploadImages: jest.fn(),
  },
}));

describe('Publish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = jest.fn();
    window.alert = jest.fn();
  });

  test('sends mediaUrls/mediaType when publishing with images', async () => {
    postsService.getTags.mockResolvedValue([]);
    uploadService.uploadImages.mockResolvedValue(['https://example.com/a.jpg']);
    postsService.createPost.mockResolvedValue({ id: 'p1' });

    const { getByPlaceholderText, getByText, container } = render(<Publish />);

    // Wait initial tags effect to settle to avoid act warnings
    await act(async () => {});

    fireEvent.change(getByPlaceholderText('请输入标题...'), { target: { value: 'Hello' } });
    fireEvent.change(getByPlaceholderText('分享你的经验和想法...'), { target: { value: 'World' } });

    // Upload one image
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });

    // Click the enabled publish button
    fireEvent.click(getByText('发布'));

    await waitFor(() => expect(postsService.createPost).toHaveBeenCalledTimes(1));

    expect(postsService.createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaUrls: ['https://example.com/a.jpg'],
        mediaType: 'image',
      })
    );
  });
});
