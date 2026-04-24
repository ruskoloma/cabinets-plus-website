"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { scrollPageToTop } from "@/components/special/catalog-overview/use-pagination-scroll";

export default function RouteScrollReset() {
  const pathname = usePathname();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (window.location.hash) return;

    scrollPageToTop();
  }, [pathname]);

  return null;
}
