import { extractVideoCover } from '../../utils/videoCover';

describe('extractVideoCover', () => {
  test('returns a Blob generated from the first frame', async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);

    try {
      // JSDOM may not implement these APIs.
      URL.createObjectURL = jest.fn(() => 'blob:video');
      URL.revokeObjectURL = jest.fn(() => {});

      // Minimal canvas mock
      const toBlob = jest.fn((cb) => cb(new Blob(['x'], { type: 'image/jpeg' })));
      const drawImage = jest.fn();

      let createdVideo;

      document.createElement = (tagName) => {
        if (tagName === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: () => ({ drawImage }),
            toBlob,
          };
        }
        if (tagName === 'video') {
          const listeners = {};
          createdVideo = {
            preload: '',
            muted: false,
            playsInline: false,
            crossOrigin: '',
            src: '',
            currentTime: 0,
            videoWidth: 640,
            videoHeight: 360,
            addEventListener: (evt, cb) => {
              listeners[evt] = cb;
            },
            removeEventListener: (evt) => {
              delete listeners[evt];
            },
            // Used by the util to trigger events in test
            __fire: (evt) => listeners[evt]?.(),
            load: () => {
              // no-op
            },
          };
          return createdVideo;
        }
        return originalCreateElement(tagName);
      };

      const promise = extractVideoCover(new File(['video'], 'a.mp4', { type: 'video/mp4' }));

      // Let the util attach event listeners, then drive the mocked video lifecycle.
      await Promise.resolve();
      createdVideo.__fire('loadedmetadata');
      await Promise.resolve();
      createdVideo.__fire('seeked');

      const blob = await promise;

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
      expect(drawImage).toHaveBeenCalled();
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      document.createElement = originalCreateElement;
    }
  });
});
