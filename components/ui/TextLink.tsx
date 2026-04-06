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
  dataTinaField?: string;
}

export default function TextLink({
  href,
  children,
  tone = "primary",
  size = "medium",
  disabled = false,
  className = "",
  dataTinaField,
}: TextLinkProps) {
  const disabledClass = !disabled
    ? ""
    : tone === "white"
      ? "cp-text-link--disabled cp-text-link--disabled-white"
      : tone === "neutral"
        ? "cp-text-link--disabled cp-text-link--disabled-neutral"
        : "cp-text-link--disabled cp-text-link--disabled-primary";

  const base = [
    "cp-text-link",
    `cp-text-link--${size}`,
    `cp-text-link--tone-${tone}`,
    disabledClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (disabled) {
    return (
      <span aria-disabled className={base}>
        {children}
      </span>
    );
  }

  return (
    <Link className={base} data-tina-field={dataTinaField} href={href}>
      {children}
    </Link>
  );
}
