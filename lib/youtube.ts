// Recognize the formats editors actually paste:
//   https://www.youtube.com/watch?v=ID
//   https://youtu.be/ID
//   https://www.youtube.com/shorts/ID
//   https://www.youtube.com/embed/ID
//   https://www.youtube.com/live/ID
const YOUTUBE_ID_RE =
  /(?:youtube\.com\/(?:watch\?(?:[^#&?]*&)*v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})(?:[?&#].*)?$/i;

export function extractYouTubeId(url: string): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(YOUTUBE_ID_RE);
  return match ? match[1] : null;
}
