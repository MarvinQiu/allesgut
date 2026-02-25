import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import Masonry from '../../components/Masonry';

// Simple fake ResizeObserver that we can trigger manually
class FakeResizeObserver {
  static instances = [];

  constructor(callback) {
    this._callback = callback;
    this._elements = new Set();
    FakeResizeObserver.instances.push(this);
  }

  observe = (el) => {
    this._elements.add(el);
  };

  unobserve = (el) => {
    this._elements.delete(el);
  };

  disconnect = () => {
    this._elements.clear();
  };

  trigger = () => {
    const entries = Array.from(this._elements).map((target) => ({ target }));
    this._callback(entries);
  };
}

describe('Masonry', () => {
  beforeEach(() => {
    FakeResizeObserver.instances = [];
    global.ResizeObserver = FakeResizeObserver;
    jest.restoreAllMocks();
  });

  test('renders items in DOM order (data order)', async () => {
    const items = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
      { id: 'c', title: 'C' },
    ];

    render(
      <Masonry
        items={items}
        getKey={(x) => x.id}
        renderItem={(x) => <div>{x.title}</div>}
      />
    );

    const els = await screen.findAllByTestId('masonry-item');
    expect(els.map((el) => el.textContent)).toEqual(['A', 'B', 'C']);
  });

  test('falls back to normal flow layout when ResizeObserver is missing', () => {
    delete global.ResizeObserver;

    const items = [{ id: 'a', title: 'A' }];

    render(
      <Masonry
        items={items}
        getKey={(x) => x.id}
        renderItem={(x) => <div>{x.title}</div>}
      />
    );

    const item = screen.getByTestId('masonry-item');
    expect(item.style.position).toBe('');
  });

  test('positions items with translate3d when ResizeObserver is available', async () => {
    const items = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ];

    const { container } = render(
      <Masonry
        items={items}
        gap={12}
        getKey={(x) => x.id}
        renderItem={(x) => <div>{x.title}</div>}
      />
    );

    // Provide deterministic measurements
    const root = container.querySelector('[data-testid="masonry-root"]');
    Object.defineProperty(root, 'clientWidth', { value: 400, configurable: true });

    const wrappers = container.querySelectorAll('[data-testid="masonry-item"]');
    wrappers.forEach((w, idx) => {
      Object.defineProperty(w, 'offsetHeight', { value: idx === 0 ? 100 : 120, configurable: true });
    });

    // Trigger observers (container + items)
    FakeResizeObserver.instances.forEach((inst) => inst.trigger());

    await waitFor(() => {
      wrappers.forEach((w) => {
        expect(w.style.transform).toMatch(/translate3d\(/);
        expect(w.style.position).toBe('absolute');
      });
    });
  });

  test('does not overflow container width (prevents horizontal scroll)', async () => {
    const items = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ];

    const { container } = render(
      <div style={{ width: '430px' }}>
        <Masonry
          items={items}
          gap={12}
          getKey={(x) => x.id}
          renderItem={(x) => <div>{x.title}</div>}
        />
      </div>
    );

    const root = container.querySelector('[data-testid="masonry-root"]');
    // Simulate a padded container (e.g. Tailwind px-4) by setting clientWidth and computed padding.
    // If we don't subtract padding, the last column can overflow and trigger horizontal scrolling.
    Object.defineProperty(root, 'clientWidth', { value: 430, configurable: true });
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (el === root) return { paddingLeft: '16px', paddingRight: '16px' };
      return { paddingLeft: '0px', paddingRight: '0px' };
    });

    const wrappers = container.querySelectorAll('[data-testid="masonry-item"]');
    wrappers.forEach((w, idx) => {
      Object.defineProperty(w, 'offsetHeight', { value: idx === 0 ? 100 : 120, configurable: true });
    });

    FakeResizeObserver.instances.forEach((inst) => inst.trigger());

    await waitFor(() => {
      wrappers.forEach((w) => {
        const width = parseFloat(w.style.width);
        const match = /translate3d\(([-\d.]+)px,/.exec(w.style.transform);
        const x = match ? parseFloat(match[1]) : 0;

        // Items should never extend beyond container width.
        // Use a tiny epsilon to avoid flaky failures due to subpixel rounding differences.
        // Root is 430px wide, but with 16px padding on each side the inner content width is 398px.
        expect(x + width).toBeLessThanOrEqual(398 + 0.01);
      });
    });
  });
});
