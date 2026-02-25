import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const getColumnCount = (width) => {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
};

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const Masonry = ({
  items,
  renderItem,
  getKey,
  className = '',
  gap = 12,
}) => {
  const rootRef = useRef(null);
  const rafIdRef = useRef(null);

  const [layoutEnabled, setLayoutEnabled] = useState(() => typeof ResizeObserver !== 'undefined');
  const [positions, setPositions] = useState(() => new Map());
  const [containerHeight, setContainerHeight] = useState(undefined);

  const itemRefs = useRef(new Map());

  const stableItems = useMemo(() => items || [], [items]);

  const scheduleLayout = () => {
    if (!layoutEnabled) return;
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      performLayout();
    });
  };

  const performLayout = () => {
    const root = rootRef.current;
    if (!root) return;

    const width = root.clientWidth;

    // If the container has horizontal padding (e.g. Tailwind px-*), root.clientWidth includes it.
    // Our absolute positioning origin is the padding box, so we must subtract padding to prevent overflow.
    const styles = window.getComputedStyle(root);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const innerWidth = Math.max(0, width - paddingLeft - paddingRight);

    const cols = getColumnCount(innerWidth);
    // Use floor to avoid subpixel overflow that can cause horizontal scroll.
    const colWidth = Math.floor((innerWidth - gap * (cols - 1)) / cols);

    const colHeights = new Array(cols).fill(0);
    const nextPositions = new Map();

    stableItems.forEach((item) => {
      const key = getKey(item);
      const el = itemRefs.current.get(key);

      const height = el ? el.offsetHeight : 0;

      let colIndex = 0;
      for (let i = 1; i < cols; i++) {
        if (colHeights[i] < colHeights[colIndex]) colIndex = i;
      }

      const x = colIndex * (colWidth + gap);
      const y = colHeights[colIndex];

      nextPositions.set(key, { x, y, width: colWidth });
      colHeights[colIndex] = y + height + gap;
    });

    const height = Math.max(0, ...colHeights) - gap;

    setPositions(nextPositions);
    setContainerHeight(Number.isFinite(height) ? Math.max(0, height) : 0);
  };

  useIsomorphicLayoutEffect(() => {
    setLayoutEnabled(typeof ResizeObserver !== 'undefined');
  }, []);

  useEffect(() => {
    if (!layoutEnabled) return;

    const root = rootRef.current;
    if (!root) return;

    const observers = [];

    const rootObserver = new ResizeObserver(() => scheduleLayout());
    rootObserver.observe(root);
    observers.push(rootObserver);

    stableItems.forEach((item) => {
      const key = getKey(item);
      const el = itemRefs.current.get(key);
      if (!el) return;
      const obs = new ResizeObserver(() => scheduleLayout());
      obs.observe(el);
      observers.push(obs);
    });

    scheduleLayout();

    return () => {
      observers.forEach((o) => o.disconnect());
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutEnabled, stableItems, gap, getKey]);

  useEffect(() => {
    if (!layoutEnabled) {
      setPositions(new Map());
      setContainerHeight(undefined);
    }
  }, [layoutEnabled]);

  return (
    <div
      ref={rootRef}
      data-testid="masonry-root"
      className={className}
      style={
        layoutEnabled
          ? {
              position: 'relative',
              height: containerHeight == null ? undefined : `${containerHeight}px`,
            }
          : undefined
      }
    >
      {stableItems.map((item) => {
        const key = getKey(item);
        const pos = positions.get(key);

        return (
          <div
            key={key}
            data-testid="masonry-item"
            ref={(el) => {
              if (el) itemRefs.current.set(key, el);
              else itemRefs.current.delete(key);
            }}
            style={
              layoutEnabled && pos
                ? {
                    position: 'absolute',
                    width: `${pos.width}px`,
                    transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                  }
                : undefined
            }
          >
            {renderItem(item)}
          </div>
        );
      })}
    </div>
  );
};

export default Masonry;
