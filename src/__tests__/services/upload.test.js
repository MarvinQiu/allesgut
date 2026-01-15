import { uploadService } from '../../services/upload';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import api from '../../services/api';

describe('Upload Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    test('uploads image as FormData', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      api.post.mockResolvedValue({
        data: { success: true, data: { url: 'https://example.com/image.jpg' } }
      });

      const result = await uploadService.uploadImage(mockFile);

      expect(api.post).toHaveBeenCalledWith(
        '/upload/image',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toBe('https://example.com/image.jpg');
    });
  });

  describe('uploadImages', () => {
    test('uploads multiple images and returns array of URLs', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      api.post
        .mockResolvedValueOnce({ data: { success: true, data: { url: 'https://example.com/image1.jpg' } } })
        .mockResolvedValueOnce({ data: { success: true, data: { url: 'https://example.com/image2.jpg' } } });

      const result = await uploadService.uploadImages(mockFiles);

      expect(api.post).toHaveBeenCalledTimes(2);
      expect(result).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    });
  });

  describe('uploadVideo', () => {
    test('uploads video and returns upload id', async () => {
      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      api.post.mockResolvedValue({
        data: { success: true, data: { upload_id: 'upload-123', url: 'https://example.com/video.mp4' } }
      });

      const result = await uploadService.uploadVideo(mockFile);

      expect(result).toEqual({
        upload_id: 'upload-123',
        url: 'https://example.com/video.mp4'
      });
    });

    test('calls onProgress callback during upload', async () => {
      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const onProgress = jest.fn();

      api.post.mockImplementation((url, data, config) => {
        // Simulate progress event
        if (config.onUploadProgress) {
          config.onUploadProgress({ loaded: 50, total: 100 });
        }
        return Promise.resolve({
          data: { success: true, data: { upload_id: 'upload-123', url: 'https://example.com/video.mp4' } }
        });
      });

      await uploadService.uploadVideo(mockFile, onProgress);

      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });

  describe('getVideoStatus', () => {
    test('checks video processing status', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { status: 'completed', url: 'https://example.com/processed.mp4' } }
      });

      const result = await uploadService.getVideoStatus('upload-123');

      expect(api.get).toHaveBeenCalledWith('/upload/video/upload-123/status');
      expect(result.status).toBe('completed');
    });
  });

  describe('waitForVideoProcessing', () => {
    test('returns status when processing completes', async () => {
      api.get
        .mockResolvedValueOnce({ data: { success: true, data: { status: 'processing' } } })
        .mockResolvedValueOnce({ data: { success: true, data: { status: 'completed', url: 'https://example.com/video.mp4' } } });

      const result = await uploadService.waitForVideoProcessing('upload-123', { interval: 10 });

      expect(result.status).toBe('completed');
    });

    test('throws error when processing fails', async () => {
      api.get.mockResolvedValue({
        data: { success: true, data: { status: 'failed', error: 'Transcoding error' } }
      });

      await expect(uploadService.waitForVideoProcessing('upload-123', { interval: 10 }))
        .rejects.toThrow('Transcoding error');
    });

    test('throws timeout error when max attempts reached', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: { status: 'processing' } } });

      await expect(uploadService.waitForVideoProcessing('upload-123', { maxAttempts: 2, interval: 10 }))
        .rejects.toThrow('Video processing timeout');
    });
  });
});
