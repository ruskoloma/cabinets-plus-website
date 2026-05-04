"use client";

import { type ReactNode, useEffect } from "react";
import Button from "@/components/ui/Button";

interface CatalogMobileFilterOverlayProps {
  open: boolean;
  title: string;
  onApply: () => void;
  onClose: () => void;
  children: ReactNode;
  tabs?: ReactNode;
}

export default function CatalogMobileFilterOverlay({
  open,
  title,
  onApply,
  onClose,
  children,
  tabs,
}: CatalogMobileFilterOverlayProps) {
  useEffect(() => {
    if (!open) return;
    if (window.innerWidth >= 768) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-label={title}
      aria-modal="true"
      className="fixed inset-0 z-[90] flex justify-center overflow-y-auto bg-black/10 md:hidden"
      role="dialog"
    >
      <div className="relative h-[100dvh] w-full max-w-[393px] bg-white shadow-[0_8px_12px_6px_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)] min-[429px]:my-2 min-[429px]:h-[min(852px,calc(100dvh-16px))]">
        <button
          aria-label={`Close ${title}`}
          className="absolute right-6 top-6 z-10 flex h-6 w-6 items-center justify-center"
          onClick={onClose}
          type="button"
        >
          <img alt="" aria-hidden className="h-6 w-6" src="/library/header/nav-close.svg" />
        </button>

        <div className="h-full overflow-y-auto px-4 pb-40 pt-12">
          <h2 className="text-center font-[var(--font-red-hat-display)] text-[20px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)]">
            {title}
          </h2>

          {tabs ? <div className="mt-10 flex justify-center">{tabs}</div> : null}

          <div className={`mx-auto w-full ${tabs ? "mt-10 max-w-[361px]" : "mt-10 max-w-[362px]"}`}>{children}</div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-white/80 backdrop-blur-[8px]">
          <div className="flex h-full items-center justify-center gap-4">
            <Button className="pointer-events-auto !h-12 !px-8 !text-[20px]" onClick={onApply} size="small" variant="secondary">
              Apply
            </Button>
            <Button className="pointer-events-auto !h-12 !w-[117px] !px-0 !text-[20px]" onClick={onClose} size="small" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
