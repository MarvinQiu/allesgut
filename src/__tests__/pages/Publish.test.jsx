import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Publish from '../../pages/Publish';
import { postsService } from '../../services/posts';
import { uploadService } from '../../services/upload';
import { extractVideoCover } from '../../utils/videoCover';

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
    uploadImage: jest.fn(),
    uploadVideo: jest.fn(),
  },
}));

jest.mock('../../utils/videoCover', () => ({
  extractVideoCover: jest.fn(),
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

    await waitFor(() => expect(postsService.getTags).toHaveBeenCalledTimes(1));

    fireEvent.change(getByPlaceholderText('请输入标题...'), { target: { value: 'Hello' } });
    fireEvent.change(getByPlaceholderText('分享你的经验和想法...'), { target: { value: 'World' } });

    // Upload one image
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"][accept="image/*"]');
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

  test('publishes a video with extracted coverUrl', async () => {
    postsService.getTags.mockResolvedValue([]);
    const coverBlob = new Blob(['c'], { type: 'image/jpeg' });
    extractVideoCover.mockResolvedValue(coverBlob);
    uploadService.uploadImage.mockResolvedValue('https://example.com/cover.jpg');
    uploadService.uploadVideo.mockResolvedValue({ url: 'https://example.com/video.mp4' });
    postsService.createPost.mockResolvedValue({ id: 'p2' });

    const { getByPlaceholderText, getByText, container } = render(<Publish />);

    await waitFor(() => expect(postsService.getTags).toHaveBeenCalledTimes(1));

    fireEvent.change(getByPlaceholderText('请输入标题...'), { target: { value: 'Video title' } });
    fireEvent.change(getByPlaceholderText('分享你的经验和想法...'), { target: { value: 'Video content' } });

    const videoFile = new File(['v'], 'a.mp4', { type: 'video/mp4' });
    const videoInput = container.querySelector('input[type="file"][accept="video/*"]');
    fireEvent.change(videoInput, { target: { files: [videoFile] } });

    fireEvent.click(getByText('发布'));

    await waitFor(() => expect(postsService.createPost).toHaveBeenCalledTimes(1));

    expect(postsService.createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaType: 'video',
        mediaUrls: ['https://example.com/video.mp4'],
        coverUrl: 'https://example.com/cover.jpg',
      })
    );
  });
});
