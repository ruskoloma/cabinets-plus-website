"use client";

interface SortOption {
  value: string;
  label: string;
}

interface CatalogSortDropdownProps {
  isOpen: boolean;
  options: readonly SortOption[];
  selectedLabel: string;
  selectedValue: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onOpen: () => void;
  onSelect: (value: string) => void;
}

export default function CatalogSortDropdown({
  isOpen,
  options,
  selectedLabel,
  selectedValue,
  onMouseEnter,
  onMouseLeave,
  onOpen,
  onSelect,
}: CatalogSortDropdownProps) {
  return (
    <div className="relative z-20 self-start pb-3" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 font-[var(--font-red-hat-display)] text-[16px] leading-none text-[var(--cp-primary-500)] md:text-[18px]"
        onClick={onOpen}
        onMouseEnter={onMouseEnter}
        type="button"
      >
        <span>
          Sort by <span className="font-bold">{selectedLabel}</span>
        </span>
        <img
          alt=""
          aria-hidden
          className={`h-4 w-4 transition-transform ${isOpen ? "-rotate-90" : "rotate-90"}`}
          src="/library/header/nav-chevron-right.svg"
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-40 mt-3 w-[256px] max-w-[calc(100vw-2rem)] bg-white p-6 shadow-[0_8px_12px_0_rgba(0,0,0,0.15),0_4px_4px_0_rgba(0,0,0,0.3)] sm:left-auto sm:right-0">
          <p className="font-[var(--font-red-hat-display)] text-[28px] font-semibold leading-[1.25] text-[var(--cp-primary-500)]">
            Sort By:
          </p>

          <div aria-label="Sort products" className="mt-6 flex flex-col gap-4" role="menu">
            {options.map((option) => {
              const selected = selectedValue === option.value;

              return (
                <button
                  aria-checked={selected}
                  className={`text-left font-[var(--font-red-hat-display)] text-[18px] leading-[1.5] text-[var(--cp-primary-500)] transition-colors ${
                    selected ? "font-semibold" : "hover:text-[var(--cp-brand-neutral-300)]"
                  }`}
                  key={option.value}
                  onClick={() => onSelect(option.value)}
                  role="menuitemradio"
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
