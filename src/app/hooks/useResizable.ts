import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizableOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  direction: 'left' | 'right';
  getOtherWidth?: () => number;
  minCenterWidth?: number;
}

export function useResizable({ initialWidth, minWidth, maxWidth, direction, getOtherWidth, minCenterWidth = 300 }: UseResizableOptions) {
  const [width, setWidth] = useState(initialWidth);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const clampWidth = useCallback((w: number) => {
    let clamped = Math.min(maxWidth, Math.max(minWidth, w));
    if (getOtherWidth) {
      const windowWidth = window.innerWidth;
      const otherWidth = getOtherWidth();
      const maxAllowed = windowWidth - otherWidth - minCenterWidth;
      clamped = Math.min(clamped, maxAllowed);
      clamped = Math.max(minWidth, clamped);
    }
    return clamped;
  }, [minWidth, maxWidth, getOtherWidth, minCenterWidth]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const raw = direction === 'left'
        ? startWidth.current + delta
        : startWidth.current - delta;
      const clamped = clampWidth(raw);

      // When hitting a limit, re-anchor so the panel stays locked
      // and only moves once the mouse crosses back past the boundary
      if (clamped !== raw) {
        startX.current = e.clientX;
        startWidth.current = clamped;
        document.body.style.cursor = 'not-allowed';
      } else {
        document.body.style.cursor = 'col-resize';
      }

      setWidth(clamped);
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minWidth, maxWidth, direction, clampWidth]);

  // Re-clamp when window resizes
  useEffect(() => {
    const onResize = () => {
      setWidth((prev) => clampWidth(prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampWidth]);

  return { width, onMouseDown };
}
