"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { tinaField } from "tinacms/dist/react";

interface NavChild {
  label: string;
  href: string;
}

interface NavLink {
  label: string;
  href?: string;
  children?: NavChild[];
}

interface GlobalData {
  siteName: string;
  logo?: string;
  phone: string;
  address: string;
  navSearchLabel?: string;
  navSearchLink?: string;
  navLinks?: NavLink[];
}

interface CatalogItem {
  name: string;
  code: string;
  image: string;
  imageFrame?: {
    width: number;
    height: number;
  };
}

type ProductCatalogKey = "cabinets" | "countertops" | "flooring";
const DESKTOP_DROPDOWN_TOP = 90;
const DESKTOP_DROPDOWN_LEFT_OFFSET = 30;
const DESKTOP_PRODUCTS_DROPDOWN_SIZE = { width: 599, height: 558 } as const;
const DESKTOP_SERVICES_DROPDOWN_SIZE = { width: 332, height: 262 } as const;

const PRODUCT_CATALOG_BY_KEY: Record<ProductCatalogKey, { columnWidth: number; items: CatalogItem[] }> = {
  cabinets: {
    columnWidth: 203,
    items: [
      { name: "Trenton Fairy", code: "#TGB", image: "/figma/assets/nav-catalog-tgb.png" },
      { name: "Trenton Swan White", code: "#TWB", image: "/figma/assets/nav-catalog-twb.png" },
      { name: "Designer White", code: "#SWK", image: "/figma/assets/nav-catalog-swk.png" },
      { name: "Artisanal Blue", code: "#ABB", image: "/figma/assets/nav-catalog-abb.png" },
      { name: "Artisanal Ebony", code: "#AEB", image: "/figma/assets/nav-catalog-aeb.png" },
    ],
  },
  countertops: {
    columnWidth: 232,
    items: [
      {
        name: "Calacatta Dolce",
        code: "#CalacattaDolce",
        image: "/figma/assets/nav-catalog-countertops-calacatta-dolce.png",
        imageFrame: { width: 162, height: 80 },
      },
      {
        name: "Calacatta Simple Grey",
        code: "#CalacattaSimpleGrey",
        image: "/figma/assets/nav-catalog-countertops-calacatta-simple-grey.png",
        imageFrame: { width: 162, height: 80 },
      },
      {
        name: "Calacatta Slim Gold",
        code: "#CalacattaSlimGold",
        image: "/figma/assets/nav-catalog-countertops-calacatta-slim-gold.png",
        imageFrame: { width: 157, height: 80 },
      },
      {
        name: "Calacatta Simple Gold",
        code: "#CalacattaSimpleGold",
        image: "/figma/assets/nav-catalog-countertops-calacatta-simple-gold.png",
        imageFrame: { width: 157, height: 80 },
      },
      {
        name: "Calacatta Straight Grey",
        code: "#CalacattaStraightGrey",
        image: "/figma/assets/nav-catalog-countertops-calacatta-straight-grey.png",
        imageFrame: { width: 162, height: 80 },
      },
    ],
  },
  flooring: {
    columnWidth: 251,
    items: [
      {
        name: "Prescott XL Wolfeboro",
        code: "#MPR-WOLFEBORO-XL",
        image: "/figma/assets/nav-catalog-flooring-prescott-xl-wolfeboro.png",
      },
      {
        name: "Prescott XL Woburn",
        code: "#MPR-WOBURN-XL",
        image: "/figma/assets/nav-catalog-flooring-prescott-xl-woburn.png",
      },
      {
        name: "Prescott XL Walnut Waves",
        code: "#MPR-WALNUT-WAVES-XL",
        image: "/figma/assets/nav-catalog-flooring-prescott-xl-walnut-waves.png",
      },
      {
        name: "Prescott XL Runmill Isle",
        code: "#MPR-RUNMILL-ISLE-XL",
        image: "/figma/assets/nav-catalog-flooring-prescott-xl-runmill-isle.png",
      },
      {
        name: "Prescott XL Kardigan",
        code: "#MPR-KARDIGAN-XL",
        image: "/figma/assets/nav-catalog-flooring-prescott-xl-kardigan.png",
      },
    ],
  },
};

function getProductCatalogKey(label: string): ProductCatalogKey {
  const normalized = label.toLowerCase();
  if (normalized.includes("counter")) return "countertops";
  if (normalized.includes("floor")) return "flooring";
  return "cabinets";
}

function getServiceSortRank(label: string): number {
  const normalized = label.toLowerCase();
  if (normalized.includes("kitchen")) return 0;
  if (normalized.includes("bathroom")) return 1;
  return 2;
}

function CaretIcon() {
  return (
    <svg aria-hidden className="h-[14px] w-[14px]" fill="none" viewBox="0 0 14 14">
      <path d="M3.5 5.25 7 8.75l3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

function SearchIcon() {
  return <img alt="" aria-hidden className="h-6 w-6" src="/figma/assets/nav-search.svg" />;
}

function MenuIcon() {
  return <img alt="" aria-hidden className="h-6 w-6" src="/figma/assets/nav-menu.svg" />;
}

function CloseIcon() {
  return <img alt="" aria-hidden className="h-6 w-6" src="/figma/assets/nav-close.svg" />;
}

function ChevronRightIcon() {
  return <img alt="" aria-hidden className="h-[18px] w-[18px]" src="/figma/assets/nav-chevron-right.svg" />;
}

function KitchenIcon() {
  return (
    <svg aria-hidden className="h-10 w-10" fill="none" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect fill="white" height="40" width="40" />
      <rect height="38" stroke="#2E2E2E" strokeWidth="2" width="16" x="1" y="1" />
      <rect height="14" stroke="#2E2E2E" strokeWidth="2" width="38" x="1" y="25" />
      <rect fill="#2E2E2E" height="2" width="6" x="7" y="20" />
      <rect fill="#2E2E2E" height="2" rx="1" width="2" x="23" y="28" />
      <rect fill="#2E2E2E" height="2" rx="1" width="2" x="31" y="28" />
      <rect height="6" stroke="#2E2E2E" strokeWidth="2" width="22" x="17" y="19" />
      <line stroke="#2E2E2E" strokeWidth="2" x1="28" x2="28" y1="25" y2="39" />
      <path d="M28 18L28 10C28 8.89543 27.1046 8 26 8C24.8954 8 24 8.89543 24 10L24 11" stroke="#2E2E2E" strokeWidth="2" />
      <path d="M32 16C32 15.4477 32.4477 15 33 15C33.5523 15 34 15.4477 34 16V18H32V16Z" fill="#2E2E2E" />
      <path d="M22 16C22 15.4477 22.4477 15 23 15C23.5523 15 24 15.4477 24 16V18H22V16Z" fill="#2E2E2E" />
    </svg>
  );
}

function BathroomIcon() {
  return (
    <svg aria-hidden className="h-10 w-10" fill="none" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect fill="white" height="40" width="40" />
      <rect height="19" stroke="#2E2E2E" strokeWidth="2" width="24" x="8" y="1" />
      <path d="M30 24C30 26.7614 27.7614 29 25 29H15C12.2386 29 10 26.7614 10 24H30Z" stroke="#2E2E2E" strokeWidth="2" />
      <path d="M29 27H35V39H5V27H11" stroke="#2E2E2E" strokeWidth="2" />
      <path d="M23 23L23 17C23 15.8954 22.1046 15 21 15L19 15C17.8954 15 17 15.8954 17 17L17 17.4" stroke="#2E2E2E" strokeWidth="2" />
      <line stroke="#2E2E2E" strokeWidth="2" x1="20" x2="20" y1="29" y2="39" />
      <rect fill="#2E2E2E" height="2" transform="rotate(-90 23 36)" width="5" x="23" y="36" />
      <rect fill="#2E2E2E" height="2" transform="rotate(-90 15 36)" width="5" x="15" y="36" />
    </svg>
  );
}

function getProductIcon(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("cabinet")) return "/figma/assets/nav-product-cabinets.svg";
  if (normalized.includes("counter")) return "/figma/assets/nav-product-countertops.svg";
  return "/figma/assets/nav-product-flooring.svg";
}

function getDesktopProductIcon(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("cabinet")) return "/figma/assets/nav-product-cabinets-desktop.svg";
  if (normalized.includes("counter")) return "/figma/assets/nav-product-countertops.svg";
  return "/figma/assets/nav-product-flooring.svg";
}

export default function Header({ data, raw }: { data: GlobalData; raw: Record<string, unknown> }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopProductsOpen, setDesktopProductsOpen] = useState(false);
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [desktopSearchValue, setDesktopSearchValue] = useState("");
  const [activeProductCatalogKey, setActiveProductCatalogKey] = useState<ProductCatalogKey>("cabinets");
  const [productsPanelLeft, setProductsPanelLeft] = useState<number | null>(null);
  const [servicesPanelLeft, setServicesPanelLeft] = useState<number | null>(null);
  const desktopHeaderRef = useRef<HTMLDivElement | null>(null);
  const productsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const servicesTriggerRef = useRef<HTMLButtonElement | null>(null);
  const logoLabel = useMemo(() => data.siteName || "Cabinets Plus", [data.siteName]);
  const topBarAddress = useMemo(() => data.address.split(",")[0].trim(), [data.address]);

  const productsGroup = useMemo(() => data.navLinks?.find((link) => link.label.toLowerCase() === "products"), [data.navLinks]);
  const servicesGroup = useMemo(() => data.navLinks?.find((link) => link.label.toLowerCase() === "services"), [data.navLinks]);
  const staticLinks = useMemo(() => data.navLinks?.filter((link) => !link.children?.length).slice(0, 3) || [], [data.navLinks]);
  const productsItems = useMemo(() => (productsGroup?.children || []).slice(0, 3), [productsGroup]);
  const servicesItems = useMemo(() => {
    const list = servicesGroup?.children || [];
    return [...list].sort((a, b) => getServiceSortRank(a.label) - getServiceSortRank(b.label));
  }, [servicesGroup]);

  const defaultProductCatalogKey = useMemo<ProductCatalogKey>(() => {
    if (!productsItems.length) return "cabinets";
    return getProductCatalogKey(productsItems[0].label);
  }, [productsItems]);

  const productsPanelOpen = desktopProductsOpen && !desktopSearchOpen;
  const servicesPanelOpen = desktopServicesOpen && !desktopSearchOpen;
  const activeCatalog = PRODUCT_CATALOG_BY_KEY[activeProductCatalogKey];
  const desktopProductsPanelLink =
    productsItems.find((item) => getProductCatalogKey(item.label) === activeProductCatalogKey)?.href ||
    productsItems[0]?.href ||
    "/cabinets";

  const getDropdownLeft = useCallback((triggerElement: HTMLButtonElement, panelWidth: number): number => {
    if (!desktopHeaderRef.current) return 0;
    const headerRect = desktopHeaderRef.current.getBoundingClientRect();
    const triggerRect = triggerElement.getBoundingClientRect();
    const left = triggerRect.left - headerRect.left - DESKTOP_DROPDOWN_LEFT_OFFSET;
    return Math.max(0, Math.min(left, headerRect.width - panelWidth));
  }, []);

  const updateProductsPanelPosition = useCallback(() => {
    if (!productsTriggerRef.current) return;
    setProductsPanelLeft(getDropdownLeft(productsTriggerRef.current, DESKTOP_PRODUCTS_DROPDOWN_SIZE.width));
  }, [getDropdownLeft]);

  const updateServicesPanelPosition = useCallback(() => {
    if (!servicesTriggerRef.current) return;
    setServicesPanelLeft(getDropdownLeft(servicesTriggerRef.current, DESKTOP_SERVICES_DROPDOWN_SIZE.width));
  }, [getDropdownLeft]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setActiveProductCatalogKey(defaultProductCatalogKey);
  }, [defaultProductCatalogKey]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!desktopHeaderRef.current) return;
      if (!desktopHeaderRef.current.contains(event.target as Node)) {
        setDesktopProductsOpen(false);
        setDesktopServicesOpen(false);
        setDesktopSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDesktopProductsOpen(false);
        setDesktopServicesOpen(false);
        setDesktopSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!productsPanelOpen && !servicesPanelOpen) return;

    const handleResize = () => {
      if (productsPanelOpen) updateProductsPanelPosition();
      if (servicesPanelOpen) updateServicesPanelPosition();
    };

    if (productsPanelOpen) updateProductsPanelPosition();
    if (servicesPanelOpen) {
      updateServicesPanelPosition();
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [productsPanelOpen, servicesPanelOpen, updateProductsPanelPosition, updateServicesPanelPosition]);

  const openProductsPanel = () => {
    setDesktopProductsOpen(true);
    setDesktopServicesOpen(false);
    setDesktopSearchOpen(false);
    setActiveProductCatalogKey(defaultProductCatalogKey);
    updateProductsPanelPosition();
  };

  const openServicesPanel = () => {
    setDesktopServicesOpen(true);
    setDesktopProductsOpen(false);
    setDesktopSearchOpen(false);
    updateServicesPanelPosition();
  };

  const closeDesktopDropdowns = () => {
    setDesktopProductsOpen(false);
    setDesktopServicesOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="bg-[var(--cp-brand-neutral-100)] px-4 py-2 md:px-10">
        <div className="cp-container flex items-center justify-center gap-8 text-[14px] leading-6 text-[var(--cp-primary-500)] md:justify-end md:gap-16">
          <span className="inline-flex items-center gap-2 whitespace-nowrap" data-tina-field={tinaField(raw, "phone")}>
            <img alt="" aria-hidden className="h-4 w-4" src="/figma/assets/icon-phone.svg" />
            <span className="hidden font-semibold md:inline">Call Us:</span>
            <span>{data.phone}</span>
          </span>

          <span className="inline-flex items-center gap-3 whitespace-nowrap" data-tina-field={tinaField(raw, "address")}>
            <img alt="" aria-hidden className="h-4 w-4" src="/figma/assets/icon-location.svg" />
            <span className="hidden font-semibold md:inline">Find Us:</span>
            <span>{topBarAddress}</span>
          </span>
        </div>
      </div>

      <div className="h-[90px] border-b border-[var(--cp-primary-100)] px-4 md:px-8">
        <div
          className="cp-container relative flex h-full items-center justify-between gap-4"
          onMouseLeave={closeDesktopDropdowns}
          ref={desktopHeaderRef}
        >
          <Link aria-label={logoLabel} className="inline-flex items-center" href="/">
            {data.logo ? (
              <img alt={logoLabel} className="h-[37px] w-auto" data-tina-field={tinaField(raw, "logo")} src={data.logo} />
            ) : (
              <span className="font-[var(--font-red-hat-display)] text-2xl font-semibold uppercase tracking-wide text-[var(--cp-primary-500)]">{logoLabel}</span>
            )}
          </Link>

          <div className="hidden items-center md:flex">
            {desktopSearchOpen ? (
              <div className="flex h-12 w-[600px] items-center gap-2 rounded-[2px] border border-[rgba(0,16,32,0.2)] bg-white pl-6 pr-4">
                <SearchIcon />
                <input
                  aria-label={data.navSearchLabel || "Search"}
                  className="h-full flex-1 border-0 bg-transparent text-sm leading-6 text-[var(--cp-primary-500)] outline-none placeholder:text-[var(--cp-primary-300)]"
                  onChange={(event) => setDesktopSearchValue(event.target.value)}
                  placeholder="Enter name of a product or its code."
                  value={desktopSearchValue}
                />
                <button
                  aria-label="Close search"
                  className="text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-brand-neutral-300)]"
                  onClick={() => {
                    setDesktopSearchOpen(false);
                    setDesktopSearchValue("");
                  }}
                  type="button"
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <nav className="flex items-center gap-12">
                <button
                  className="flex items-center gap-1 text-sm leading-6 text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-brand-neutral-300)]"
                  ref={productsTriggerRef}
                  onClick={() => {
                    if (desktopProductsOpen) {
                      setDesktopProductsOpen(false);
                    } else {
                      openProductsPanel();
                    }
                  }}
                  onMouseEnter={openProductsPanel}
                  type="button"
                >
                  <span>Products</span>
                  <CaretIcon />
                </button>

                {servicesGroup ? (
                  <button
                    className="flex items-center gap-1 text-sm leading-6 text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-brand-neutral-300)]"
                    ref={servicesTriggerRef}
                    onClick={() => {
                      if (desktopServicesOpen) {
                        setDesktopServicesOpen(false);
                      } else {
                        openServicesPanel();
                      }
                    }}
                    onMouseEnter={openServicesPanel}
                    type="button"
                  >
                    <span>{servicesGroup.label}</span>
                    <CaretIcon />
                  </button>
                ) : null}

                {staticLinks.map((link) => (
                  <Link
                    className="text-sm leading-6 text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-brand-neutral-300)]"
                    href={link.href || "#"}
                    key={`${link.label}-${link.href || "page"}`}
                    onMouseEnter={closeDesktopDropdowns}
                  >
                    {link.label}
                  </Link>
                ))}

                <button
                  aria-label={data.navSearchLabel || "Search"}
                  className="text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-brand-neutral-300)]"
                  onClick={() => {
                    closeDesktopDropdowns();
                    setDesktopSearchOpen(true);
                  }}
                  onMouseEnter={closeDesktopDropdowns}
                  type="button"
                >
                  <SearchIcon />
                </button>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-5 md:hidden">
            <Link aria-label={data.navSearchLabel || "Search"} className="text-[var(--cp-primary-500)]" href={data.navSearchLink || "/"}>
              <SearchIcon />
            </Link>
            <button aria-expanded={mobileOpen} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} onClick={() => setMobileOpen((v) => !v)} type="button">
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

          {productsPanelOpen ? (
            <div
              className="absolute z-50 hidden overflow-hidden bg-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] md:block"
              onMouseEnter={() => {
                setDesktopProductsOpen(true);
                setDesktopServicesOpen(false);
              }}
              style={{
                left: `${productsPanelLeft ?? 0}px`,
                top: `${DESKTOP_DROPDOWN_TOP}px`,
                width: `${DESKTOP_PRODUCTS_DROPDOWN_SIZE.width}px`,
                height: `${DESKTOP_PRODUCTS_DROPDOWN_SIZE.height}px`,
              }}
            >
              <span className="absolute left-0 top-0 h-[2px] w-[120px] bg-[var(--cp-primary-500)]" />
              <span className="absolute left-[245px] top-0 h-full w-px bg-[var(--cp-primary-100)]" />

              <div className="absolute left-10 top-10 w-[185px]">
                <p className="font-[var(--font-red-hat-display)] text-[24px] font-normal uppercase tracking-[0.04em] text-[var(--cp-primary-500)]">Products</p>
                <div className="mt-10 space-y-8">
                  {productsItems.map((item) => {
                    const catalogKey = getProductCatalogKey(item.label);
                    const isActive = activeProductCatalogKey === catalogKey;
                    return (
                      <Link
                        className={`flex items-center justify-between ${isActive ? "" : "opacity-60"}`}
                        href={item.href}
                        key={`${item.label}-${item.href}-desktop-products`}
                        onClick={() => setDesktopProductsOpen(false)}
                        onFocus={() => setActiveProductCatalogKey(catalogKey)}
                        onMouseEnter={() => setActiveProductCatalogKey(catalogKey)}
                      >
                        <span className="flex items-center gap-4">
                          <img alt="" aria-hidden className="h-10 w-10" src={getDesktopProductIcon(item.label)} />
                          <span className={`text-base font-medium text-[var(--cp-primary-500)] ${catalogKey === "countertops" ? "leading-none" : "leading-6"}`}>
                            {item.label}
                          </span>
                        </span>
                        {isActive ? <ChevronRightIcon /> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="absolute left-[280px] top-10 w-[162px]">
                <p className="font-[var(--font-red-hat-display)] text-[24px] font-normal uppercase tracking-[0.04em] text-[var(--cp-primary-500)]">Catalog</p>
              </div>

              <div className="absolute left-[286px] top-[110px] space-y-8" style={{ width: `${activeCatalog.columnWidth}px` }}>
                {activeCatalog.items.map((item) => (
                  <article className="flex items-center gap-5" key={`${activeProductCatalogKey}-${item.name}-${item.code}`}>
                    <span className="relative block h-10 w-10 overflow-hidden">
                      {item.imageFrame ? (
                        <img
                          alt=""
                          aria-hidden
                          className="absolute left-0 top-0 max-w-none object-cover"
                          src={item.image}
                          style={{
                            width: `${item.imageFrame.width}px`,
                            height: `${item.imageFrame.height}px`,
                          }}
                        />
                      ) : (
                        <img alt="" aria-hidden className="h-10 w-10 object-cover" src={item.image} />
                      )}
                    </span>
                    <div className="text-base leading-[1.2]">
                      <p className="text-[var(--cp-primary-500)]">{item.name}</p>
                      <p className="text-[var(--cp-primary-300)]">{item.code}</p>
                    </div>
                  </article>
                ))}
              </div>

              <Link
                className="absolute left-[286px] top-[478px] inline-flex h-10 items-center justify-center bg-[var(--cp-primary-500)] px-5 text-base font-medium leading-none text-white transition-colors hover:bg-[#3a3a3a]"
                href={desktopProductsPanelLink}
                onClick={() => setDesktopProductsOpen(false)}
              >
                View All Catalog
              </Link>
            </div>
          ) : null}

          {servicesPanelOpen && servicesItems.length ? (
            <div
              className="absolute z-50 hidden overflow-hidden bg-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] md:block"
              onMouseEnter={() => {
                setDesktopServicesOpen(true);
                setDesktopProductsOpen(false);
              }}
              style={{
                left: `${servicesPanelLeft ?? 0}px`,
                top: `${DESKTOP_DROPDOWN_TOP}px`,
                width: `${DESKTOP_SERVICES_DROPDOWN_SIZE.width}px`,
                height: `${DESKTOP_SERVICES_DROPDOWN_SIZE.height}px`,
              }}
            >
              <div className="absolute left-10 top-10 w-[269px]">
                <p className="font-[var(--font-red-hat-display)] text-[24px] font-normal uppercase leading-[1.25] tracking-[0.04em] text-[var(--cp-primary-500)]">Services</p>
                <div className="mt-10 space-y-8">
                  {servicesItems.map((item) => (
                    <Link
                      className="flex items-center gap-4 text-base font-medium leading-6 text-[var(--cp-primary-500)]"
                      href={item.href}
                      key={`${item.label}-${item.href}-desktop-services`}
                      onClick={() => setDesktopServicesOpen(false)}
                    >
                      {item.label.toLowerCase().includes("kitchen") ? <KitchenIcon /> : <BathroomIcon />}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[130px] z-40 overflow-y-auto border-t border-[var(--cp-primary-100)] bg-white px-[21px] pb-10 pt-6 md:hidden">
          <nav className="mx-auto max-w-[347px]">
            <div>
              <p className="text-[18px] leading-6 uppercase text-[var(--cp-primary-500)]">Products</p>
              <div className="mt-3 border-t border-[var(--cp-primary-100)]">
                {productsItems.map((item) => (
                  <Link
                    className="flex items-center justify-between border-b border-[var(--cp-primary-100)] py-3"
                    href={item.href}
                    key={`${item.label}-${item.href}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex items-center gap-4">
                      <img alt="" aria-hidden className="h-10 w-10" src={getProductIcon(item.label)} />
                      <span className="text-base font-medium text-[var(--cp-primary-500)]">{item.label}</span>
                    </span>
                    <ChevronRightIcon />
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <p className="text-[18px] leading-6 uppercase text-[var(--cp-primary-500)]">Services</p>
              <div className="mt-3 border-t border-[var(--cp-primary-100)]">
                {servicesItems.map((item) => (
                  <Link
                    className="flex items-center justify-between border-b border-[var(--cp-primary-100)] py-3"
                    href={item.href}
                    key={`${item.label}-${item.href}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex items-center gap-4">
                      {item.label.toLowerCase().includes("kitchen") ? <KitchenIcon /> : <BathroomIcon />}
                      <span className="text-base font-medium text-[var(--cp-primary-500)]">{item.label}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-10 space-y-8">
              {staticLinks.map((link) => (
                <Link
                  className="block text-[18px] leading-6 uppercase text-[var(--cp-primary-500)]"
                  href={link.href || "#"}
                  key={`${link.label}-${link.href}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
