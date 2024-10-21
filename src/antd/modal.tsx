import { Modal as AntdModal, type ModalProps as AntdModalProps } from 'antd';
import { useEffect, useState } from 'react';

import { useOverlayRef } from '../overlay-ref.context';

const noop = () => {};

export interface ModalProps extends Omit<AntdModalProps, 'visible'> {
  /**
   * 默认这个 Modal 只能用在 Overlay 中
   *
   * 可以通过设置 `outOfOverlay` 为 `true` 让其在在 Overlay 外也能使用
   */
  outOfOverlay?: boolean;
}

/**
 * 即用即扔的 Modal，一般需要与 useOverlay 一起使用
 *
 * 处理了弹出/关闭逻辑以更适合与 useOverlay 一起使用的场景
 */
export const Modal = (props: ModalProps) => {
  const [open, setOpen] = useState(true);
  const [resolve, setResolve] = useState(() => noop);

  const overlayRef = useOverlayRef(props.outOfOverlay ?? false);

  useEffect(() => {
    const dispose = overlayRef?.onBeforeClose(() => {
      // 等 Modal 的关闭动画完成后再销毁组件
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
    <AntdModal
      {...props}
      open={open}
      afterClose={() => {
        props.afterClose?.();
        resolve?.();
      }}
      onOk={(e) => {
        props.onOk?.(e);
      }}
      onCancel={(e) => {
        props.onCancel?.(e);
      }}
    >
      {props.children}
    </AntdModal>
  );
};
