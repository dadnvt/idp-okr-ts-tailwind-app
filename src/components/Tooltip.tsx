import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { createPortal } from 'react-dom';

export function Tooltip({
  content,
  children,
  placement = 'top',
  widthClass = 'w-80 max-w-[85vw]',
}: {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  widthClass?: string;
}) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    const tip = tooltipRef.current;
    if (!anchor || !tip) return;

    const margin = 8;
    const gap = 10; // space between anchor and tooltip
    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();

    let top = 0;
    let left = 0;

    if (placement === 'bottom') {
      top = a.bottom + gap;
      left = a.left + a.width / 2 - t.width / 2;
    } else if (placement === 'left') {
      top = a.top + a.height / 2 - t.height / 2;
      left = a.left - gap - t.width;
    } else if (placement === 'right') {
      top = a.top + a.height / 2 - t.height / 2;
      left = a.right + gap;
    } else {
      // top (default)
      top = a.top - gap - t.height;
      left = a.left + a.width / 2 - t.width / 2;
    }

    // Clamp to viewport so it never goes off-screen
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    left = Math.max(margin, Math.min(left, vw - margin - t.width));
    top = Math.max(margin, Math.min(top, vh - margin - t.height));

    setStyle({ top, left });
  }, [open, placement, content]);

  const arrowPos =
    placement === 'bottom'
      ? 'top-[-6px] left-1/2 -translate-x-1/2 border-b-gray-800'
      : placement === 'left'
        ? 'right-[-6px] top-1/2 -translate-y-1/2 border-l-gray-800'
        : placement === 'right'
          ? 'left-[-6px] top-1/2 -translate-y-1/2 border-r-gray-800'
          : 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-gray-800';

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open
        ? createPortal(
            <span
              className={[
                'pointer-events-none fixed z-[9999]',
                widthClass,
              ].join(' ')}
              style={{ top: style.top, left: style.left }}
            >
              <span
                ref={tooltipRef}
                className="relative block rounded-xl border border-gray-700 bg-gray-800 text-white text-sm leading-snug px-3 py-2 shadow-xl whitespace-normal break-words text-left"
              >
                <span
                  className={[
                    'absolute h-0 w-0 border-[6px] border-transparent',
                    arrowPos,
                  ].join(' ')}
                />
                {content}
              </span>
            </span>,
            document.body
          )
        : null}
    </span>
  );
}

export function InfoLabel({
  label,
  tooltip,
  placement,
  className,
}: {
  label: ReactNode;
  tooltip: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  return (
    <div className={['inline-flex items-center gap-2', className || ''].join(' ')}>
      <span>{label}</span>
      <Tooltip content={tooltip} placement={placement}>
        <span
          className="text-gray-400 hover:text-gray-600 cursor-help"
          aria-label="Info"
        >
          <FaInfoCircle size={14} />
        </span>
      </Tooltip>
    </div>
  );
}


