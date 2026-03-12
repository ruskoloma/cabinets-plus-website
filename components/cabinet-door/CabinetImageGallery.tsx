"use client";

import { useState } from "react";
import { tinaField } from "tinacms/dist/react";
import type { CabinetData, CabinetGalleryItem } from "./types";

interface CabinetImageGalleryProps {
  cabinet: CabinetData;
  items: CabinetGalleryItem[];
}

function getTinaFieldValue(cabinet: CabinetData, item: CabinetGalleryItem): string | undefined {
  if (item.sourceType === "picture") {
    return tinaField(cabinet as unknown as Record<string, unknown>, "picture");
  }

  if (item.source) {
    return tinaField(item.source as unknown as Record<string, unknown>, "file");
  }

  return undefined;
}

export default function CabinetImageGallery({ cabinet, items }: CabinetImageGalleryProps) {
  const [activeFile, setActiveFile] = useState<string | null>(items[0]?.file || null);
  const activeItem = items.find((item) => item.file === activeFile) || items[0];
  const isPrimaryDoorImage = activeItem?.sourceType === "picture";

  return (
    <div className="flex flex-col-reverse gap-5 lg:flex-row lg:gap-7">
      <div className="cp-hide-scrollbar flex flex-shrink-0 gap-4 overflow-x-auto pb-1 lg:h-[557px] lg:w-fit lg:flex-col lg:items-start lg:gap-[29px] lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-2">
        {items.map((item, index) => {
          const isActive = activeItem?.file === item.file;
          return (
            <button
              className={`relative h-[90px] w-[90px] shrink-0 overflow-hidden border transition ${isActive ? "border-[var(--cp-primary-500)]" : "border-transparent"}`}
              data-tina-field={getTinaFieldValue(cabinet, item)}
              key={`${item.file}-${index}`}
              onClick={() => setActiveFile(item.file)}
              type="button"
            >
              <img alt="" aria-hidden className="h-full w-full object-cover" src={item.file} />
            </button>
          );
        })}
      </div>

      <div className="relative w-full max-w-[557px] max-h-[557px] bg-[#fafafa]">
        <div className="aspect-square w-full">
          {activeItem ? (
            <img
              alt={cabinet.name || "Cabinet door"}
              className={`h-full w-full ${isPrimaryDoorImage ? "object-contain p-[11.8%]" : "object-contain p-0"}`}
              data-tina-field={getTinaFieldValue(cabinet, activeItem)}
              src={activeItem.file}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
