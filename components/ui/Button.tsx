import Link from "next/link";

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  type?: "button" | "submit";
  size?: "large" | "small";
  disabled?: boolean;
  dataTinaField?: string;
}

export default function Button({
  href,
  onClick,
  children,
  variant = "primary",
  className = "",
  type = "button",
  size = "large",
  disabled = false,
  dataTinaField,
}: ButtonProps) {
  const classes = [
    "cp-btn",
    `cp-btn--${variant}`,
    `cp-btn--${size}`,
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cp-primary-500)]",
    disabled ? "cp-btn--disabled pointer-events-none" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    if (disabled) {
      return (
        <span aria-disabled className={classes}>
          {children}
        </span>
      );
    }

    return (
      <Link className={classes} data-tina-field={dataTinaField} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} data-tina-field={dataTinaField} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}
