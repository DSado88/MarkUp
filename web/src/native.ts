export type DocumentPayload = {
  fileName: string;
  path: string;
  baseURL: string;
  text: string;
  dirty: boolean;
};

type NativeMessage =
  | { type: "ready" }
  | { type: "textChanged"; text: string }
  | { type: "save" }
  | { type: "reload" }
  | { type: "reveal" }
  | { type: "copyPath" }
  | { type: "openExternal"; url: string };

export type NativeEnvelope =
  | { type: "loadDocument"; payload: DocumentPayload }
  | { type: "saved"; payload: { text: string } }
  | { type: "externalChange"; payload: Record<string, never> };

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        markUp?: {
          postMessage: (message: NativeMessage) => void;
        };
      };
    };
    markUpNativeReceive: (message: NativeEnvelope) => void;
  }
}

export function sendToNative(message: NativeMessage) {
  window.webkit?.messageHandlers?.markUp?.postMessage(message);
}
