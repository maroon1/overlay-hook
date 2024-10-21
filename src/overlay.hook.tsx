import { useCallback, useContext, useMemo, type ReactNode } from 'react';

import { OverlayRef } from './overlay-ref';
import { OverlayContext } from './overlay.context';

class KeyGenerator {
  private count = 0;

  generate() {
    return `${++this.count}`;
  }
}

const overlayKey = new KeyGenerator();

export interface OpenOverlayFunction<TResult> {
  /**
   * 打开弹出层
   *
   * @param overlay 弹出层组件
   */
  (overlay: ReactNode): OverlayRef<TResult>;
}

/**
 * 弹出层的的通用 Hook
 *
 * 可以基于此 Hook 封装更加特定的弹窗组件，例如 `useDialog`, `useModal`, `usePopover` 之类
 *
 * @returns 获取 Overlay 的操作方法，均为稳定的方法，可以放心的放在 hook 的 deps 中
 *
 * @example
 *
 * ```tsx
 * import { FC } from 'react';
 *
 * const Greeting: FC<{ name: string }> = (props) => {
 *   const overlayRef = useOverlayRef<string>();
 *
 *   return (
 *     <dialog open>
 *       <h1>欢迎</h1>
 *       <button
 *         onClick={() =>
 *           overlayRef.close(`Hello, ${props.name}`)
 *         }
 *       >
 *         打招呼
 *       </button>
 *     </dialog>
 *   );
 * };
 *
 * const Demo: FC = () => {
 *   const [openOverlay, closeOverlay] = useOverlay<string>();
 *
 *   const onOpen = async () => {
 *     const overlayRef = openOverlay(<Greeting name="World" />);
 *     const result = await overlayRef.afterClosed;
 *
 *     // 输出 Hello world
 *     console.log(result);
 *   };
 *
 *   const onClose = () => {
 *     // 也可以通过 closeOverlay 在外面直接关闭
 *     // 此时 `overlayRef.afterClosed` 返回的 result 为 undefined
 *     closeOverlay();
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={onOpen}>打开</button>
 *       <button onClick={onClose}>关闭</button>
 *     </>
 *   );
 * };
 * ```
 * 注意⚠️：每个 Hook 只会创建一个弹出层实例，即调用多次 `openOverlay` 只会打开最后一个弹出层
 *
 * 如果要**同一时间**存在多个弹出层，则需要调用多次 `useOverlay`
 */
export function useOverlay<TResult = unknown>(): [
  openOverlay: OpenOverlayFunction<TResult>,
  closeOverlay: () => void,
] {
  const key = useMemo(() => overlayKey.generate(), []);
  const context = useContext(OverlayContext);

  if (!context) {
    throw new Error(
      'Overlay Context 不存在，请检查组件是否挂载在 OverlayProvider 的子组件中',
    );
  }

  const openOverlay = useCallback<OpenOverlayFunction<TResult>>(
    (overlay) => {
      return context.openOverlay(key, overlay) as OverlayRef<TResult>;
    },
    [context, key],
  );

  const closeOverlay = useCallback(() => {
    context.closeOverlay(key);
  }, [context, key]);

  return [openOverlay, closeOverlay];
}
