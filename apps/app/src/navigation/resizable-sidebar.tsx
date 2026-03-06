import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ResizableSidebarProps {
  /** Current collapsed state from parent */
  collapsed: boolean;
  /** Min width in px when expanded */
  minWidth?: number;
  /** Max width in px */
  maxWidth?: number;
  /** Default width in px */
  defaultWidth?: number;
  /** Width when collapsed */
  collapsedWidth?: number;
  children: React.ReactNode;
}

/**
 * A sidebar wrapper that adds a draggable splitter on the right edge
 * so the user can resize the navigation panel.
 */
export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  collapsed,
  minWidth = 140,
  maxWidth = 480,
  defaultWidth = 220,
  collapsedWidth = 60,
  children,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(defaultWidth);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (collapsed) return; // don't allow resize when collapsed
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;
      e.preventDefault();
    },
    [collapsed, width],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minWidth, maxWidth]);

  const effectiveWidth = collapsed ? collapsedWidth : width;

  return (
    <div
      style={{
        position: 'relative',
        width: effectiveWidth,
        minWidth: effectiveWidth,
        background: '#2c2c3e',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: isDragging.current ? 'none' : 'width 0.2s',
      }}
    >
      {children}

      {/* ── Splitter handle ─────────────────────────────── */}
      {!collapsed && (
        <div
          onMouseDown={onMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 6,
            height: '100%',
            cursor: 'col-resize',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Visual indicator line */}
          <div
            style={{
              width: 2,
              height: 40,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              transition: 'background 0.15s, height 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.height = '60px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.height = '40px';
            }}
          />
        </div>
      )}
    </div>
  );
};

