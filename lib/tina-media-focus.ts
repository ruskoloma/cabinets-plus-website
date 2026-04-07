export const TINA_SIDEBAR_MEDIA_ITEM_ATTRIBUTE = "data-cp-tina-media-item";
export const TINA_FOCUS_PROJECT_MEDIA_MESSAGE = "cp:tina-focus-project-media";
const TINA_MEDIA_FOCUS_RETRY_DELAYS_MS = [0, 120, 260, 480, 760, 1120];

function normalizeMediaFile(file?: string | null): string {
  if (typeof file !== "string") return "";
  return file.split("?")[0].trim();
}

function postMessageToTinaParent(message: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.parent || window.parent === window) return;
  window.parent.postMessage(message, "*");
}

export function getTinaSidebarMediaItemId(file?: string | null): string | undefined {
  const normalized = normalizeMediaFile(file);
  if (!normalized) return undefined;
  return encodeURIComponent(normalized);
}

export function focusTinaSidebarMediaItem({
  rootFieldName,
  mediaFile,
}: {
  rootFieldName?: string;
  mediaFile?: string | null;
}) {
  const itemId = getTinaSidebarMediaItemId(mediaFile);

  if (rootFieldName) {
    postMessageToTinaParent({ type: "field:selected", fieldName: rootFieldName });
  }

  if (!itemId) return;

  TINA_MEDIA_FOCUS_RETRY_DELAYS_MS.forEach((delay) => {
    window.setTimeout(() => {
      postMessageToTinaParent({
        type: TINA_FOCUS_PROJECT_MEDIA_MESSAGE,
        itemId,
      });
    }, delay);
  });
}
