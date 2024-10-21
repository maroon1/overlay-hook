import { createContext, useContext } from 'react';
import { OverlayRef } from './overlay-ref';

const OverlayRefContext = createContext<OverlayRef<unknown> | null>(null);

export const OverlayRefProvider = OverlayRefContext.Provider;

export function useOverlayRef<TResult>(optional?: false): OverlayRef<TResult>;
// prettier-ignore
export function useOverlayRef<TResult>(optional: boolean): OverlayRef<TResult> | null;
/**
 * 获取当前上下文中的 Overlay 对象
 * @param optional 是否是可选的，可选的情况下，当 overlayRef 不存在的时候不会报错，此时 overlayRef 可能为 null
 * @returns Overlay 对象的引用，是个稳定的对象，可以放心的放在 hook 的 deps 中
 */
export function useOverlayRef<TResult>(
  optional = false,
): OverlayRef<TResult> | null {
  const overlayRef = useContext(OverlayRefContext);

  if (!overlayRef && !optional) {
    throw new Error('未找到 Overlay，请检查组件是否在 Overlay Hook 中使用');
  }

  return overlayRef as OverlayRef<TResult>;
}
