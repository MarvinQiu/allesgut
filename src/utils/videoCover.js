export async function extractVideoCover(file) {
  const url = URL.createObjectURL(file);

  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = url;

    await new Promise((resolve, reject) => {
      const onLoaded = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        resolve();
      };
      const onError = () => {
        video.removeEventListener('error', onError);
        reject(new Error('Failed to load video metadata'));
      };
      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);
      video.load?.();
    });

    await new Promise((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      const onError = () => {
        video.removeEventListener('error', onError);
        reject(new Error('Failed to seek video'));
      };

      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', onError);
      video.currentTime = 0.1;
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1;
    canvas.height = video.videoHeight || 1;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) {
            reject(new Error('Failed to create cover blob'));
            return;
          }
          resolve(b);
        },
        'image/jpeg',
        0.8
      );
    });

    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
