import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { OverlayRef } from './overlay-ref';
import { OverlayRefProvider } from './overlay-ref.context';

export const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * 弹出层的容器，也是弹出层 DOM 元素所在的根节点
 *
 * 现在组件树中放置该容器，再使用 useOverlay 的 Hook
 */
export const OverlayProvider: FC<PropsWithChildren> = ({ children }) => {
  const [overlaysConfig, setConfig] = useState<Record<string, OverlayConfig>>(
    {},
  );

  const closeOverlay = useCallback<InternalCloseOverlayFunction>(
    (overlayKey) => {
      setConfig((prevConfig) => {
        const overlay = prevConfig[overlayKey];

        if (!overlay) {
          return prevConfig;
        }

        return {
          ...prevConfig,
          [overlayKey]: { ...overlay, isOpen: false },
        };
      });
    },
    [],
  );

  const openOverlay = useCallback<InternalOpenOverlayFunction>(
    (overlayKey, element) => {
      const overlayRef = new OverlayRef(() => closeOverlay(overlayKey));

      setConfig((prevConfig) => {
        return {
          ...prevConfig,
          [overlayKey]: {
            isOpen: true,
            element,
            overlayRef,
          },
        };
      });

      return overlayRef;
    },
    [closeOverlay],
  );

  const contextValue = useMemo<OverlayContextValue>(() => {
    return {
      openOverlay,
      closeOverlay,
      isOpenedOverlay: Object.values(overlaysConfig).some(
        ({ isOpen }) => isOpen,
      ),
    };
  }, [openOverlay, closeOverlay, overlaysConfig]);

  const overlays = useMemo(() => {
    return Object.keys(overlaysConfig).map((overlayKey) => {
      const overlay = overlaysConfig[overlayKey];

      if (!overlay) {
        return null;
      }

      const { element, isOpen, overlayRef } = overlay;

      if (!isOpen && !overlayRef.closed) {
        overlayRef.close();
      }

      return (
        <OverlayRefProvider key={overlayKey} value={overlayRef}>
          {isOpen && element}
        </OverlayRefProvider>
      );
    });
  }, [overlaysConfig]);

  return (
    <OverlayContext.Provider value={contextValue}>
      {children}
      {overlays}
    </OverlayContext.Provider>
  );
};

interface InternalCloseOverlayFunction {
  (overlayKey: string): void;
}

interface InternalOpenOverlayFunction {
  (overlayKey: string, element: ReactNode): OverlayRef<unknown>;
}

interface OverlayContextValue {
  openOverlay: InternalOpenOverlayFunction;
  closeOverlay: InternalCloseOverlayFunction;
  isOpenedOverlay: boolean;
}

interface OverlayConfig {
  isOpen: boolean;
  element: ReactNode;
  overlayRef: OverlayRef<unknown>;
}
