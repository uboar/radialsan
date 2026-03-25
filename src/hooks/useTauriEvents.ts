// Placeholder: hook for subscribing to Tauri events from the backend
import { useEffect } from "react";

type EventCallback<T> = (payload: T) => void;

/**
 * Subscribe to a Tauri backend event.
 * Returns a cleanup function that unlistens on unmount.
 */
export function useTauriEvent<T>(
  eventName: string,
  callback: EventCallback<T>,
): void {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    // Dynamically import to avoid issues in non-Tauri environments (e.g. tests)
    import("@tauri-apps/api/event")
      .then(({ listen }) => listen<T>(eventName, (event) => callback(event.payload)))
      .then((fn) => {
        unlisten = fn;
      })
      .catch(console.error);

    return () => {
      unlisten?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);
}
