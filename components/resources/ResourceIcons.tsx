/**
 * Line icons for the /resources cards, drawn to match the existing
 * public/library/icons set: 24x24 box, 1.5 stroke, round caps and joins.
 * Inline (rather than <img src="…svg">) so they inherit the card's text
 * colour on hover.
 */

interface IconProps {
  className?: string;
}

function Icon({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      focusable="false"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

/** Corner arrows — "open this at full size". */
export function ExpandIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M14 4h6v6" />
      <path d="M10 20H4v-6" />
      <path d="M20 4l-7 7" />
      <path d="M4 20l7-7" />
    </Icon>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 3v12" />
      <path d="M7.5 10.5L12 15l4.5-4.5" />
      <path d="M4 19h16" />
    </Icon>
  );
}

/** Document sheet with a folded corner — the base for file-type badges. */
export function FileIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M13.5 3H7a1.5 1.5 0 00-1.5 1.5v15A1.5 1.5 0 007 21h10a1.5 1.5 0 001.5-1.5V8z" />
      <path d="M13.5 3v5H18.5" />
    </Icon>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Icon>
  );
}
