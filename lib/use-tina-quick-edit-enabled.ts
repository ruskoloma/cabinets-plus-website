"use client";

import { useSyncExternalStore } from "react";

const TINA_QUICK_EDIT_ENABLED_CLASS = "__tina-quick-editing-enabled";

function isTinaQuickEditEnabled() {
  if (typeof document === "undefined") return false;
  return document.body.classList.contains(TINA_QUICK_EDIT_ENABLED_CLASS);
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleMessage = (event: MessageEvent) => {
    const payload = event.data && typeof event.data === "object" ? (event.data as Record<string, unknown>) : null;
    if (!payload || payload.type !== "quickEditEnabled" || typeof payload.value !== "boolean") return;
    onStoreChange();
  };

  window.addEventListener("message", handleMessage);

  if (typeof MutationObserver === "undefined") {
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }

  const observer = new MutationObserver(() => {
    onStoreChange();
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => {
    window.removeEventListener("message", handleMessage);
    observer.disconnect();
  };
}

export function useTinaQuickEditEnabled() {
  return useSyncExternalStore(subscribe, isTinaQuickEditEnabled, () => false);
}
