"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { tinaField } from "tinacms/dist/react";
import Button from "@/components/ui/Button";

interface NavChild { label: string; href: string }
interface NavLink {
  label: string;
  href?: string;        // present for simple links
  children?: NavChild[]; // present for dropdowns
}
interface GlobalData {
  siteName: string;
  phone: string;
  address: string;
  ctaLabel: string;
  ctaLink: string;
  navLinks: NavLink[];
}

// ── Desktop Dropdown Item ──────────────────────────────────────────────────
function DropdownItem({ link }: { link: NavLink }) {
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setOpen(true);
  };
  const onLeave = () => {
    timeout.current = setTimeout(() => setOpen(false), 120);
  };

  if (!link.children?.length) {
    // Simple link
    return (
      <li>
        <Link
          href={link.href || "#"}
          className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors"
        >
          {link.label}
        </Link>
      </li>
    );
  }

  // Dropdown
  return (
    <li className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">
        {link.label}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
          {link.children.map((child, j) => (
            <Link
              key={j}
              href={child.href}
              className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}

// ── Mobile Nav Item (collapsible dropdown) ───────────────────────────────
function MobileNavItem({ link, onClose }: { link: NavLink; onClose: () => void }) {
  const [open, setOpen] = useState(false);

  if (!link.children?.length) {
    return (
      <li>
        <Link
          href={link.href || "#"}
          className="block py-2 text-sm font-medium text-slate-700 hover:text-amber-600"
          onClick={onClose}
        >
          {link.label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-700 hover:text-amber-600"
      >
        {link.label}
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="pl-4 border-l border-amber-200 mt-1 space-y-1 mb-2">
          {link.children.map((child, j) => (
            <li key={j}>
              <Link
                href={child.href}
                className="block py-1.5 text-sm text-slate-600 hover:text-amber-600"
                onClick={onClose}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Main Header ────────────────────────────────────────────────────────────
export default function Header({ data, raw }: { data: GlobalData; raw: any }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-slate-800 text-slate-300 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <span data-tina-field={tinaField(raw, "address")}>{data.address}</span>
          <a
            href={`tel:${data.phone}`}
            data-tina-field={tinaField(raw, "phone")}
            className="text-amber-400 font-semibold hover:text-amber-300 transition-colors"
          >
            {data.phone}
          </a>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span data-tina-field={tinaField(raw, "siteName")} className="text-xl font-bold text-slate-800">
            {data.siteName}
          </span>
          <span className="text-xl font-bold text-amber-600">+</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-6">
          {data.navLinks?.map((link, i) => (
            <DropdownItem key={i} link={link} />
          ))}
        </ul>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <Button href={data.ctaLink}>{data.ctaLabel}</Button>
          </div>
          <button
            className="md:hidden p-2 rounded text-slate-700 hover:bg-slate-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-4">
          <ul className="flex flex-col pt-3">
            {data.navLinks?.map((link, i) => (
              <MobileNavItem key={i} link={link} onClose={() => setMenuOpen(false)} />
            ))}
          </ul>
          <div className="mt-4">
            <Button href={data.ctaLink} className="w-full text-center">{data.ctaLabel}</Button>
          </div>
        </div>
      )}
    </header>
  );
}
