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
});
