'use client';

import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './style.scss';

type VirtualScrollEventMap<T> = {
  scroll: {
    scrollTop: number;
    viewportHeight: number;
  };
  rangeChange: {
    startIndex: number;
    endIndex: number;
  };
  itemClick: {
    item: T;
    index: number;
  };
};

type VirtualScrollEventName<T> = keyof VirtualScrollEventMap<T>;
type VirtualScrollEventHandler<T, K extends VirtualScrollEventName<T>> = (
  payload: VirtualScrollEventMap<T>[K]
) => void;

class VirtualScrollChannel<T> {
  private listeners = new Map<VirtualScrollEventName<T>, Set<(payload: unknown) => void>>();

  subscribe<K extends VirtualScrollEventName<T>>(
    eventName: K,
    handler: VirtualScrollEventHandler<T, K>
  ) {
    const current = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    current.add(handler as (payload: unknown) => void);
    this.listeners.set(eventName, current);

    return () => {
      const listeners = this.listeners.get(eventName);
      listeners?.delete(handler as (payload: unknown) => void);

      if (listeners && listeners.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  publish<K extends VirtualScrollEventName<T>>(eventName: K, payload: VirtualScrollEventMap<T>[K]) {
    this.listeners.get(eventName)?.forEach((listener) => {
      listener(payload);
    });
  }
}

interface HAVirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  initialLoadCount?: number;
  loadMoreCount?: number;
  loadMoreThreshold?: number;
  endText?: ReactNode;
  endTextHeight?: number;
  className?: string;
  itemClassName?: string;
  itemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
  onItemClick?: (item: T, index: number) => void;
}

function HAVirtualScroll<T>({
  items,
  itemHeight,
  overscan = 4,
  initialLoadCount = 20,
  loadMoreCount = 20,
  loadMoreThreshold = 12,
  endText = '没有更多内容了~',
  endTextHeight = 44,
  className,
  itemClassName,
  itemKey,
  renderItem,
  empty = null,
  onItemClick,
}: HAVirtualScrollProps<T>) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const eventChannelRef = useRef(new VirtualScrollChannel<T>());
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    viewportHeight: 0,
  });
  const [range, setRange] = useState({
    startIndex: 0,
    endIndex: Math.min(items.length, 12),
  });
  const [loadState, setLoadState] = useState(() => ({
    items,
    initialLoadCount,
    count: Math.min(items.length, Math.max(1, initialLoadCount)),
  }));

  const loadedCount =
    loadState.items === items && loadState.initialLoadCount === initialLoadCount
      ? loadState.count
      : Math.min(items.length, Math.max(1, initialLoadCount));

  const loadMore = useCallback(() => {
    setLoadState((current) => {
      const currentCount =
        current.items === items && current.initialLoadCount === initialLoadCount
          ? current.count
          : Math.min(items.length, Math.max(1, initialLoadCount));

      return {
        items,
        initialLoadCount,
        count: Math.min(items.length, currentCount + loadMoreCount),
      };
    });
  }, [initialLoadCount, items, loadMoreCount]);

  const dataLayer = useMemo(
    () => ({
      items,
      total: items.length,
      loadedTotal: loadedCount,
      isAllLoaded: loadedCount >= items.length,
      itemsHeight: loadedCount * itemHeight,
      totalHeight: loadedCount * itemHeight + (loadedCount >= items.length ? endTextHeight : 0),
    }),
    [endTextHeight, itemHeight, items, loadedCount]
  );

  const calculateWindow = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return {
        scrollTop: 0,
        viewportHeight: 0,
      };
    }

    return {
      scrollTop: viewport.scrollTop,
      viewportHeight: viewport.clientHeight,
    };
  }, []);

  useEffect(() => {
    const unsubscribeScroll = eventChannelRef.current.subscribe(
      'scroll',
      ({ scrollTop, viewportHeight }) => {
        const visibleCount = Math.max(1, Math.ceil(viewportHeight / itemHeight));
        const minLoadedCount = Math.min(
          dataLayer.total,
          Math.max(initialLoadCount, visibleCount + overscan * 2)
        );

        if (dataLayer.loadedTotal < minLoadedCount) {
          setLoadState({
            items,
            initialLoadCount,
            count: minLoadedCount,
          });
        }

        const isTouchBottom =
          scrollTop + viewportHeight >= dataLayer.totalHeight - loadMoreThreshold;

        if (isTouchBottom && !dataLayer.isAllLoaded) {
          loadMore();
        }

        const maxStartIndex = Math.max(0, dataLayer.loadedTotal - visibleCount);
        const startIndex = Math.min(
          maxStartIndex,
          Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
        );
        const endIndex = Math.min(
          dataLayer.loadedTotal,
          startIndex + visibleCount + overscan * 2
        );

        setRange((current) => {
          if (current.startIndex === startIndex && current.endIndex === endIndex) {
            return current;
          }

          eventChannelRef.current.publish('rangeChange', { startIndex, endIndex });
          return { startIndex, endIndex };
        });
      }
    );

    return unsubscribeScroll;
  }, [
    dataLayer.isAllLoaded,
    dataLayer.loadedTotal,
    dataLayer.total,
    dataLayer.totalHeight,
    initialLoadCount,
    items,
    itemHeight,
    loadMore,
    loadMoreThreshold,
    overscan,
  ]);

  useEffect(() => {
    const publishScrollState = () => {
      const nextState = calculateWindow();

      setScrollState(nextState);
      eventChannelRef.current.publish('scroll', nextState);
    };

    publishScrollState();

    if (typeof window === 'undefined') {
      return;
    }

    const viewport = viewportRef.current;
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            publishScrollState();
          })
        : null;

    const handleScroll = () => {
      publishScrollState();
    };

    const handleResize = () => {
      publishScrollState();
    };

    viewport?.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    if (viewport && resizeObserver) {
      resizeObserver.observe(viewport);
    }

    return () => {
      viewport?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, [calculateWindow, dataLayer.total, dataLayer.totalHeight]);

  const normalizedRange =
    range.startIndex >= dataLayer.loadedTotal
      ? {
          startIndex: 0,
          endIndex: Math.min(dataLayer.loadedTotal, 12),
        }
      : {
          startIndex: range.startIndex,
          endIndex: Math.min(range.endIndex, dataLayer.loadedTotal),
        };

  const visibleItems = useMemo(
    () => dataLayer.items.slice(normalizedRange.startIndex, normalizedRange.endIndex),
    [dataLayer.items, normalizedRange.endIndex, normalizedRange.startIndex]
  );

  const translateY = normalizedRange.startIndex * itemHeight;

  const handleClickCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const rowElement = target.closest<HTMLElement>('[data-virtual-index]');

      if (!rowElement) {
        return;
      }

      const index = Number(rowElement.dataset.virtualIndex);
      const item = items[index];

      if (!item || Number.isNaN(index)) {
        return;
      }

      eventChannelRef.current.publish('itemClick', { item, index });
      onItemClick?.(item, index);
    },
    [items, onItemClick]
  );

  if (!dataLayer.total) {
    return <div className={['ha-virtual-scroll', className].filter(Boolean).join(' ')}>{empty}</div>;
  }

  return (
    <div
      className={['ha-virtual-scroll', className].filter(Boolean).join(' ')}
      onClickCapture={handleClickCapture}
      data-total={dataLayer.total}
      data-scroll-top={scrollState.scrollTop}
    >
      <div ref={viewportRef} className="ha-virtual-scroll-viewport">
        <div className="ha-virtual-scroll-spacer" style={{ height: dataLayer.totalHeight }}>
          <div
            className="ha-virtual-scroll-window"
            style={{ transform: `translateY(${translateY}px)` }}
          >
            {visibleItems.map((item, offset) => {
              const index = normalizedRange.startIndex + offset;

              return (
                <div
                  key={itemKey(item, index)}
                  className={['ha-virtual-scroll-item', itemClassName].filter(Boolean).join(' ')}
                  style={{ height: itemHeight }}
                  data-virtual-index={index}
                >
                  {renderItem(item, index)}
                </div>
              );
            })}
          </div>
          {dataLayer.isAllLoaded && (
            <div
              className="ha-virtual-scroll-end"
              style={{ height: endTextHeight, top: dataLayer.itemsHeight }}
            >
              {endText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HAVirtualScroll;
