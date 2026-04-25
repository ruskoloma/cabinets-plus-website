interface ClearFiltersButtonProps {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
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
      <span>{children}</span>
    </button>
  );
}
