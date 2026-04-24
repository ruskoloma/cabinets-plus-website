"use client";

import { useCallback } from "react";

function forceScrollToTop(behavior: ScrollBehavior) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const body = document.body;

  window.scrollTo({ top: 0, left: 0, behavior });
  root.scrollTop = 0;
  body.scrollTop = 0;
}

export function usePaginationScrollTarget() {
  const scrollToTarget = useCallback(() => {
    forceScrollToTop("smooth");
  }, []);

  return {
    scrollToTarget,
  };
}

export function scrollPageToTop() {
  forceScrollToTop("auto");
}
