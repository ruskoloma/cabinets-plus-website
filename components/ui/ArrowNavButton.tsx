import Link from "next/link";

interface ArrowNavButtonProps {
  href?: string;
  direction: "previous" | "next";
  ariaLabel: string;
  tone?: "primary" | "secondary";
  size?: "default" | "detail";
}

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      aria-hidden
      className={direction === "previous" ? "h-6 w-6 rotate-180" : "h-6 w-6"}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function ArrowNavButton({
  href,
  direction,
  ariaLabel,
  tone = "secondary",
  size = "default",
}: ArrowNavButtonProps) {
  const classes = ["cp-arrow-button", `cp-arrow-button--${tone}`, size === "detail" ? "cp-arrow-button--detail" : "", !href ? "cp-arrow-button--disabled" : ""]
    .filter(Boolean)
    .join(" ");

  if (!href) {
    return (
      <button aria-label={ariaLabel} className={classes} disabled type="button">
        <ArrowIcon direction={direction} />
      </button>
    );
  }

  return (
    <Link aria-label={ariaLabel} className={classes} href={href}>
      <ArrowIcon direction={direction} />
    </Link>
  );
}
