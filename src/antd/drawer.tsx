import {
  Drawer as AntdDrawer,
  type DrawerProps as AntdDrawerProps,
} from 'antd';
import { useEffect, useState } from 'react';
import { useOverlayRef } from '../overlay-ref.context';

export interface DrawerProps extends Omit<AntdDrawerProps, 'visible'> {
  /**
   * 默认这个 Drawer 只能用在 Overlay 中
   *
   * 可以通过设置 `outOfOverlay` 为 `true` 让其在在 Overlay 外也能使用
   */
  outOfOverlay?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
 * 即用即扔的 Drawer，一般需要与 useOverlay 一起使用
 *
 * 处理了弹出/关闭逻辑以更适合与 useOverlay 一起使用的场景
 */
export const Drawer = (props: DrawerProps) => {
  const [open, setOpen] = useState(true);
  const [resolve, setResolve] = useState(() => noop);

  const overlayRef = useOverlayRef(props.outOfOverlay ?? false);

  useEffect(() => {
    const dispose = overlayRef?.onBeforeClose(() => {
      // 等 Drawer 的关闭动画完成后再销毁组件
      return new Promise<void>((resolve) => {
        setOpen(false);
        setResolve(() => resolve);
      });
    });

    return () => {
      dispose?.();
    };
  }, [overlayRef]);

  useEffect(() => {
    if (overlayRef) {
      return;
    }

    setOpen(props.open ?? false);
  }, [props.open, overlayRef]);

  return (
    <AntdDrawer
      {...props}
      open={open}
      afterOpenChange={(open) => {
        props.afterOpenChange?.(open);

        if (!open) {
          resolve?.();
        }
      }}
      onClose={(e) => {
        props.onClose?.(e);
      }}
    >
      {props.children}
    </AntdDrawer>
  );
};
