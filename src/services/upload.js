import api from './api';

export const uploadService = {
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data.data.url;
  },

  async uploadImages(files) {
    const urls = await Promise.all(
      files.map(file => this.uploadImage(file))
    );
    return urls;
  },

  async uploadVideo(file, onProgress) {
    const formData = new FormData();
    formData.append('video', file);

    const response = await api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress ? (e) => {
        const progress = Math.round((e.loaded * 100) / e.total);
        onProgress(progress);
      } : undefined
    });

    return response.data.data;
  },

  async getVideoStatus(uploadId) {
    const response = await api.get(`/upload/video/${uploadId}/status`);
    return response.data.data;
  },

  async waitForVideoProcessing(uploadId, { maxAttempts = 60, interval = 2000 } = {}) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getVideoStatus(uploadId);

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Video processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Video processing timeout');
  }
};
