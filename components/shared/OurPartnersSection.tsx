"use client";

import { tinaField } from "tinacms/dist/react";
import { mapPartnerLogos, type PartnerLogoItem } from "@/app/figma-home.helpers";
import FallbackImg from "@/components/ui/FallbackImg";

interface OurPartnersSectionProps {
  block: Record<string, unknown>;
  catalogType?: "countertop" | "flooring";
}

interface CatalogPartnerItem extends PartnerLogoItem {
  featuredOnMobile?: boolean;
}

const COUNTERTOP_LOGO_CLASSES: Record<string, string> = {
  Cambria:
    "w-auto h-auto max-w-[82px] max-h-[56px] md:max-w-[118px] md:max-h-[80px]",
  Caesarstone:
    "w-auto h-auto max-w-[125px] max-h-[20px] md:max-w-[180px] md:max-h-[29px]",
  "Moda Surfaces": "w-full h-full object-contain",
  MSI: "w-full h-full object-contain",
  Bedrosians:
    "w-auto h-auto max-w-[103px] max-h-[12px] md:max-w-[175px] md:max-h-[21px]",
  Daltile:
    "w-auto h-auto max-w-[94px] max-h-[28px] md:max-w-[136px] md:max-h-[40px]",
  PentalQuartz:
    "w-auto h-auto max-w-[125px] max-h-[23px] md:max-w-[180px] md:max-h-[33px]",
  "Pental Quartz":
    "w-auto h-auto max-w-[125px] max-h-[23px] md:max-w-[180px] md:max-h-[33px]",
  "Stratus Quartz":
    "w-auto h-auto max-w-[106px] max-h-[20px] md:max-w-[180px] md:max-h-[35px]",
  HanStone:
    "w-auto h-auto max-w-[76px] max-h-[31px] md:max-w-[109px] md:max-h-[45px]",
};

const FLOORING_LOGO_CLASSES: Record<string, string> = {
  Mozaik: "object-contain w-[68px] h-[39px] md:w-[97px] md:h-[55px]",
  "Lions Floor": "object-contain w-[97px] h-[35px] md:w-[138px] md:h-[50px]",
  "Prima Floors": "object-contain w-[104px] h-[28px] md:w-[148px] md:h-[40px]",
  Flooring2: "object-contain w-[88px] h-[35px] md:w-[125px] md:h-[50px]",
  flooring2: "object-contain w-[88px] h-[35px] md:w-[125px] md:h-[50px]",
  "Wanke Cascade": "object-contain w-[116px] h-[16px] md:w-[165px] md:h-[22px]",
  MSI: "object-contain w-[66px] h-[27px] md:w-[94px] md:h-[39px]",
  Pacmat: "object-contain w-[99px] h-[28px] md:w-[141px] md:h-[40px]",
  "Pacific Mat & Flooring": "object-contain w-[99px] h-[28px] md:w-[141px] md:h-[40px]",
  Mohawk: "object-contain w-[81px] h-[25px] md:w-[115px] md:h-[36px]",
  Stonewood: "object-contain w-[104px] h-[14px] md:w-[147px] md:h-[20px]",
  "Stonewood Floors": "object-contain w-[104px] h-[14px] md:w-[147px] md:h-[20px]",
  Opus: "object-contain w-[29px] h-[35px] md:w-[41px] md:h-[50px]",
  "Opus Hardwood": "object-contain w-[29px] h-[35px] md:w-[41px] md:h-[50px]",
  "Engineered Floors": "object-contain w-[96px] h-[23px] md:w-[136px] md:h-[33px]",
};

const DEFAULT_LOGO_CLASS = "object-contain max-h-[40px] max-w-full md:max-h-[60px]";

const COUNTERTOP_PARTNER_LOGOS: CatalogPartnerItem[] = [
  { src: "/library/partners/countertops/cambria.svg", alt: "Cambria", href: "https://www.cambriausa.com/" },
  { src: "/library/partners/countertops/caesarstone.svg", alt: "Caesarstone", href: "https://www.caesarstoneus.com/" },
  { src: "/library/partners/countertops/moda-surfaces.svg", alt: "Moda Surfaces", href: "https://modasurfaces.com/" },
  { src: "/library/partners/countertops/msi.svg", alt: "MSI", href: "https://www.msisurfaces.com/" },
  { src: "/library/partners/countertops/bedrosians.svg", alt: "Bedrosians", href: "https://www.bedrosians.com/" },
  { src: "/library/partners/countertops/daltile.svg", alt: "Daltile", href: "https://www.daltile.com/" },
  { src: "/library/partners/countertops/pental-quartz.svg", alt: "Pental Quartz", href: "https://www.pentalquartz.com/" },
  { src: "/library/partners/countertops/stratus-quartz.svg", alt: "Stratus Quartz", href: "https://www.stratusquartz.com/" },
  { src: "/library/partners/countertops/hanstone.svg", alt: "HanStone", href: "https://www.hanstone.com/", featuredOnMobile: true },
];

const FLOORING_PARTNER_LOGOS: CatalogPartnerItem[] = [
  { src: "/library/partners/flooring/mozaik.svg", alt: "Mozaik", href: "https://www.mozaiksc.com/" },
  { src: "/library/partners/flooring/lions-floor.png", alt: "Lions Floor", href: "https://www.lionsfloor.com/" },
  { src: "/library/partners/flooring/prima-floors.png", alt: "Prima Floors", href: "https://www.primafloors.com/" },
  { src: "/library/partners/flooring/flooring2.png", alt: "Flooring2", href: "https://flooring2.com/" },
  { src: "/library/partners/flooring/wanke-cascade.svg", alt: "Wanke Cascade", href: "https://wankecascade.com/" },
  { src: "/library/partners/flooring/msi.svg", alt: "MSI", href: "https://www.msisurfaces.com/" },
  { src: "/library/partners/flooring/pacmat.png", alt: "Pacific Mat & Flooring", href: "https://www.pacmat.com/" },
  { src: "/library/partners/flooring/mohawk.svg", alt: "Mohawk", href: "https://www.mohawkflooring.com/" },
  { src: "/library/partners/flooring/stonewood.png", alt: "Stonewood Floors", href: "https://stonewoodfloors.com/" },
  { src: "/library/partners/flooring/opus.png", alt: "Opus Hardwood", href: "https://www.opushardwood.com/" },
  { src: "/library/partners/flooring/engineered-floors.svg", alt: "Engineered Floors", href: "https://www.engineeredfloors.com/", featuredOnMobile: true },
];

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function ExternalArrowIcon() {
  return (
    <svg aria-hidden className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.7504 6V15.75C18.7504 15.9489 18.6714 16.1397 18.5307 16.2803C18.3901 16.421 18.1993 16.5 18.0004 16.5C17.8015 16.5 17.6107 16.421 17.4701 16.2803C17.3294 16.1397 17.2504 15.9489 17.2504 15.75V7.81031L6.53104 18.5306C6.39031 18.6714 6.19944 18.7504 6.00042 18.7504C5.80139 18.7504 5.61052 18.6714 5.46979 18.5306C5.32906 18.3899 5.25 18.199 5.25 18C5.25 17.801 5.32906 17.6101 5.46979 17.4694L16.1901 6.75H8.25042C8.0515 6.75 7.86074 6.67098 7.72009 6.53033C7.57943 6.38968 7.50042 6.19891 7.50042 6C7.50042 5.80109 7.57943 5.61032 7.72009 5.46967C7.86074 5.32902 8.0515 5.25 8.25042 5.25H18.0004C18.1993 5.25 18.3901 5.32902 18.5307 5.46967C18.6714 5.61032 18.7504 5.80109 18.7504 6Z" />
    </svg>
  );
}

function getPartnerLogos(block: Record<string, unknown>, fallback: CatalogPartnerItem[]) {
  const mappedPartnerLogos = mapPartnerLogos(block.partnerLogos);
  return mappedPartnerLogos.length > 0 ? mappedPartnerLogos : fallback;
}

function CatalogPartnersSection({
  block,
  defaultDescription,
  fallbackLogos,
  logoClasses,
}: {
  block: Record<string, unknown>;
  defaultDescription: string;
  fallbackLogos: CatalogPartnerItem[];
  logoClasses: Record<string, string>;
}) {
  const partnerLogos = getPartnerLogos(block, fallbackLogos);
  const title = text(block.title, "Our partners");
  const description = text(block.description, defaultDescription);
  const footnote = text(
    block.footnote,
    "Click on a partner logo to view their products on the official website.",
  );

  return (
    <section className="bg-[var(--cp-primary-500)] text-white" data-tina-field={tinaField(block)}>
      <div className="cp-container px-4 py-12 md:px-8 md:py-[92px]">
        <div className="mx-auto flex max-w-[1378px] flex-col gap-8 md:grid md:grid-cols-[minmax(0,558px)_minmax(0,791px)] md:items-start md:gap-[28px]">
          <div className="flex flex-col md:pt-[52px]">
            <h2
              className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px]"
              data-tina-field={tinaField(block, "title")}
            >
              {title}
            </h2>
            <p
              className="mt-4 font-[var(--font-red-hat-display)] text-[18px] font-normal leading-[1.5] text-white md:mt-12 md:text-[24px]"
              data-tina-field={tinaField(block, "description")}
            >
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 overflow-hidden rounded-[2.78px] md:grid-cols-3 md:gap-[28px] md:rounded-[4px]">
              {partnerLogos.map((logo, idx) => {
                const raw = logo.raw;
                const href =
                  typeof raw?.url === "string"
                    ? (raw.url as string)
                    : typeof raw?.href === "string"
                      ? (raw.href as string)
                      : logo.href;
                const isLast = idx === partnerLogos.length - 1;
                const logoClass = logoClasses[logo.alt] || DEFAULT_LOGO_CLASS;
                const tileClass = [
                  "group relative flex items-center justify-center overflow-hidden bg-[#262626] transition-opacity hover:opacity-95",
                  isLast
                    ? "col-span-2 h-[72px] md:col-span-1 md:h-[112px]"
                    : "h-[80px] md:h-[112px]",
                ].join(" ");

                const logoImg = (
                  <span className="pointer-events-none flex h-full w-full items-center justify-center opacity-80">
                    <FallbackImg
                      alt={logo.alt}
                      className={logoClass}
                      data-tina-field={raw ? tinaField(raw as Record<string, unknown>, "logo") : undefined}
                      src={logo.src}
                    />
                  </span>
                );
                const arrow = (
                  <span className="pointer-events-none absolute right-2 top-2 text-white">
                    <ExternalArrowIcon />
                  </span>
                );

                if (href) {
                  return (
                    <a
                      aria-label={`${logo.alt} - opens in new tab`}
                      className={tileClass}
                      data-tina-field={raw ? tinaField(raw as Record<string, unknown>) : undefined}
                      href={href}
                      key={`${logo.src}-${idx}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {logoImg}
                      {arrow}
                    </a>
                  );
                }

                return (
                  <div
                    className={tileClass}
                    data-tina-field={raw ? tinaField(raw as Record<string, unknown>) : undefined}
                    key={`${logo.src}-${idx}`}
                  >
                    {logoImg}
                    {arrow}
                  </div>
                );
              })}
            </div>
            <p
              className="text-center font-[var(--font-red-hat-display)] text-[14px] font-normal leading-[1.5] text-white/60"
              data-tina-field={tinaField(block, "footnote")}
            >
              {footnote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FlooringPartnersSection({ block }: { block: Record<string, unknown> }) {
  return (
    <CatalogPartnersSection
      block={block}
      defaultDescription="In addition to the flooring options shown in our catalog, you may also order flooring from the catalogs of the manufacturers listed below. Please discuss availability and details with our manager when placing your order."
      fallbackLogos={FLOORING_PARTNER_LOGOS}
      logoClasses={FLOORING_LOGO_CLASSES}
    />
  );
}

export function CountertopPartnersSection({ block }: { block: Record<string, unknown> }) {
  return (
    <CatalogPartnersSection
      block={block}
      defaultDescription="In addition to the countertop options shown in our catalog, you may also order countertops from the catalogs of the manufacturers listed below. Please discuss availability and details with our manager when placing your order."
      fallbackLogos={COUNTERTOP_PARTNER_LOGOS}
      logoClasses={COUNTERTOP_LOGO_CLASSES}
    />
  );
}

export default function OurPartnersSection({
  block,
  catalogType = "countertop",
}: OurPartnersSectionProps) {
  if (catalogType === "flooring") {
    return <FlooringPartnersSection block={block} />;
  }

  return <CountertopPartnersSection block={block} />;
}
