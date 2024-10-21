import { useOverlayRef } from './overlay-ref.context';
import { OverlayProvider } from './overlay.context';

export { OverlayRef } from './overlay-ref';
export type { ClosingCallback, ClosingCallbacks } from './overlay-ref';
export { useOverlay } from './overlay.hook';
export type { OpenOverlayFunction } from './overlay.hook';
export { OverlayProvider, useOverlayRef };
