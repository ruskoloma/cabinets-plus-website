interface ClearFiltersButtonProps {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}

function ClearIcon() {
  return (
    <svg aria-hidden className="cp-clear-button__icon" fill="none" viewBox="0 0 16 16">
      <path d="M4 4l8 8M12 4 4 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export default function ClearFiltersButton({
  children = "Clear filters",
  className = "",
  disabled = false,
  onClick,
}: ClearFiltersButtonProps) {
  const classes = ["cp-clear-button", className].filter(Boolean).join(" ");

  return (
    <button className={classes} disabled={disabled} onClick={onClick} type="button">
      <ClearIcon />
      <span>{children}</span>
    </button>
  );
}
