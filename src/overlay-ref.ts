export interface ClosingCallback<TResult> {
  (result?: TResult): void;
}

export type ClosingCallbacks<TResult> = Map<number, ClosingCallback<TResult>>;

export class OverlayRef<TResult> {
  private static key = 0;

  private callbacks: ClosingCallbacks<TResult> = new Map();

  private _closed = false;

  private resolveCloseFn?: (value?: TResult) => void;

  /**
   * `Overlay` 是否已关闭
   */
  get closed() {
    return this._closed;
  }

  constructor(private closeOverlay: () => void) {
    this.close = this.close.bind(this);
  }

  /**
   * `Overlay` 关闭
   *
   * 关闭后，如果有回传数据，则会在这个地方拿到结果
   */
  afterClosed: Promise<TResult | undefined> = new Promise<TResult | undefined>(
    (resolve) => {
      this.resolveCloseFn = resolve;
    },
  );

  /**
   * 关闭（销毁）组件之前的回调
   *
   * 回调可以返回一个 `Promise`，`Overlay` 会等待 `Promise` 完成
   *
   * @param callback 回调
   * @returns
   */
  onBeforeClose(callback: (result?: TResult) => Promise<void> | void) {
    const key = ++OverlayRef.key;
    this.callbacks.set(key, callback);

    return () => {
      this.callbacks.delete(key);
    };
  }

  /**
   * 关闭 `Overlay`，此时可以回传一个结果
   *
   * @param result 回传结果
   * @returns
   */
  async close(result?: TResult): Promise<void> {
    if (this._closed) {
      return;
    }

    if (!this.resolveCloseFn) {
      // eslint-disable-next-line no-console
      console.warn('Overlay 未就绪');
      return;
    }

    await this.invokeOnCloseCallbacks(result);

    this._closed = true;

    this.closeOverlay();
    this.resolveCloseFn(result);

    return;
  }

  private async invokeOnCloseCallbacks(result?: TResult) {
    const callbacks = Array.from(this.callbacks.values());

    await Promise.all(callbacks.map((callback) => callback(result)));
  }
}
