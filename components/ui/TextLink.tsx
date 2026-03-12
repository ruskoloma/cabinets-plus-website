import Link from "next/link";

type Tone = "primary" | "neutral" | "white";
type Size = "small" | "medium" | "large" | "title";

interface TextLinkProps {
  href: string;
  children: React.ReactNode;
  tone?: Tone;
  size?: Size;
  disabled?: boolean;
  className?: string;
}

export default function TextLink({
  href,
  children,
  tone = "primary",
  size = "medium",
  disabled = false,
  className = "",
}: TextLinkProps) {
  const toneClass =
    tone === "white"
      ? "text-white hover:text-[var(--cp-brand-neutral-300)]"
      : tone === "neutral"
        ? "text-[var(--cp-primary-500)] hover:text-[var(--cp-brand-neutral-300)]"
        : "text-[var(--cp-brand-neutral-300)] hover:text-[#af8e6b]";

  const sizeClass =
    size === "title"
      ? "text-xl font-medium leading-[1.2]"
      : size === "large"
        ? "text-lg leading-[1.5]"
        : size === "small"
          ? "text-sm leading-[1.2]"
          : "text-base leading-[1.2]";

  const disabledClass = disabled ? "pointer-events-none text-[var(--cp-primary-100)]" : "";
  const base = `${toneClass} ${sizeClass} transition-colors duration-200 ${disabledClass} ${className}`;

  if (disabled) {
    return (
      <span aria-disabled className={base}>
        {children}
      </span>
    );
  }

  return (
    <Link className={base} href={href}>
      {children}
    </Link>
  );
}
