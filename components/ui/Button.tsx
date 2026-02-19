import Link from "next/link";

interface ButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  type?: "button" | "submit";
}

export default function Button({
  href,
  onClick,
  children,
  variant = "primary",
  className = "",
  type = "button",
}: ButtonProps) {
  const base = "inline-block px-6 py-3 rounded-md font-semibold text-sm transition-all duration-200 cursor-pointer";
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg",
    secondary: "bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:shadow-lg",
    outline: "border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white",
  };
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
