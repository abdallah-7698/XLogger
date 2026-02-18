import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizableOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  direction: 'left' | 'right';
  /** Return the current width of the other side panel so we can enforce a minimum center width */
  getOtherWidth?: () => number;
  /** Minimum width for the center panel (default 300) */
  minCenterWidth?: number;
}

export function useResizable({ initialWidth, minWidth, maxWidth, direction, getOtherWidth, minCenterWidth = 300 }: UseResizableOptions) {
  const [width, setWidth] = useState(initialWidth);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

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
      let newWidth = direction === 'left'
        ? startWidth.current + delta
        : startWidth.current - delta;
      newWidth = Math.min(maxWidth, Math.max(minWidth, newWidth));

      // Enforce minimum center width
      if (getOtherWidth) {
        const windowWidth = window.innerWidth;
        const otherWidth = getOtherWidth();
        const availableForCenter = windowWidth - otherWidth - newWidth;
        if (availableForCenter < minCenterWidth) {
          newWidth = windowWidth - otherWidth - minCenterWidth;
        }
      }

      newWidth = Math.max(minWidth, newWidth);
      setWidth(newWidth);
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
  }, [minWidth, maxWidth, direction, getOtherWidth, minCenterWidth]);

  return { width, onMouseDown };
}
