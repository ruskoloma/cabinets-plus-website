"use client";

import { tinaField } from "tinacms/dist/react";
import { mapPartnerLogos, type PartnerLogoItem } from "@/app/figma-home.helpers";
import FallbackImg from "@/components/ui/FallbackImg";

interface OurPartnersSectionProps {
  block: Record<string, unknown>;
  catalogType?: "countertop" | "flooring";
}

interface FlooringPartnerItem extends PartnerLogoItem {
  featuredOnMobile?: boolean;
  logoClassName?: string;
  kind?: "image" | "wankeCascade";
}

interface CountertopPartnerItem extends PartnerLogoItem {
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

const DEFAULT_COUNTERTOP_LOGO_CLASS =
  "w-auto h-auto max-h-[40px] max-w-full md:max-h-[60px]";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

const FLOORING_PARTNER_LOGOS: FlooringPartnerItem[] = [
  {
    src: "/library/partners/flooring/mozaik.svg",
    alt: "Mozaik",
    href: "https://www.mozaiksc.com/",
    logoClassName: "w-[67px] md:w-[122px]",
  },
  {
    src: "/library/partners/flooring/lions-floor.svg",
    alt: "Lions Floor",
    href: "https://www.lionsfloor.com/",
    logoClassName: "w-[97px] md:w-[138px]",
  },
  {
    src: "/library/partners/flooring/prima-floors.png",
    alt: "Prima Floors",
    href: "https://www.primafloors.com/",
    logoClassName: "w-[104px] md:w-[148px]",
  },
  {
    src: "/library/partners/flooring/flooring2.png",
    alt: "Flooring2",
    href: "https://flooring2.com/",
    logoClassName: "w-[88px] md:w-[125px]",
  },
  {
    src: "/library/partners/flooring/wanke-cascade-part-1.svg",
    alt: "Wanke Cascade",
    href: "https://www.wanke.com/",
    kind: "wankeCascade",
  },
  {
    src: "/library/partners/flooring/msi.svg",
    alt: "MSI",
    href: "https://www.msisurfaces.com/",
    logoClassName: "w-[76px] md:w-[94px]",
  },
  {
    src: "/library/partners/flooring/pacmat.png",
    alt: "Pacific Mat & Flooring",
    href: "https://www.pacmat.com/",
    logoClassName: "w-[99px] md:w-[141px]",
  },
  {
    src: "/library/partners/flooring/mohawk.svg",
    alt: "Mohawk",
    href: "https://www.mohawkflooring.com/",
    logoClassName: "w-[99px] md:w-[113px]",
  },
  {
    src: "/library/partners/flooring/stonewood.png",
    alt: "Stonewood Floors",
    href: "https://stonewoodfloors.com/",
    logoClassName: "w-[103px] md:w-[147px]",
  },
  {
    src: "/library/partners/flooring/opus.png",
    alt: "Opus Hardwood",
    href: "https://www.opushardwood.com/",
    logoClassName: "w-[29px] md:w-[41px]",
  },
  {
    src: "/library/partners/flooring/engineered-floors.svg",
    alt: "Engineered Floors",
    href: "https://www.engineeredfloors.com/",
    featuredOnMobile: true,
    logoClassName: "w-[95px] md:w-[136px]",
  },
];

const COUNTERTOP_PARTNER_LOGOS: CountertopPartnerItem[] = [
  {
    src: "/library/partners/countertops/cambria.svg",
    alt: "Cambria",
    href: "https://www.cambriausa.com/",
  },
  {
    src: "/library/partners/countertops/caesarstone.svg",
    alt: "Caesarstone",
    href: "https://www.caesarstoneus.com/",
  },
  {
    src: "/library/partners/countertops/moda-surfaces.svg",
    alt: "Moda Surfaces",
    href: "https://modasurfaces.com/",
  },
  {
    src: "/library/partners/countertops/msi.svg",
    alt: "MSI",
    href: "https://www.msisurfaces.com/",
  },
  {
    src: "/library/partners/countertops/bedrosians.svg",
    alt: "Bedrosians",
    href: "https://www.bedrosians.com/",
  },
  {
    src: "/library/partners/countertops/daltile.svg",
    alt: "Daltile",
    href: "https://www.daltile.com/",
  },
  {
    src: "/library/partners/countertops/pental-quartz.svg",
    alt: "Pental Quartz",
    href: "https://www.pentalquartz.com/",
  },
  {
    src: "/library/partners/countertops/stratus-quartz.svg",
    alt: "Stratus Quartz",
    href: "https://www.stratusquartz.com/",
  },
  {
    src: "/library/partners/countertops/hanstone.svg",
    alt: "HanStone",
    href: "https://www.hanstone.com/",
    featuredOnMobile: true,
  },
];

function ExternalArrowIcon() {
  return (
    <svg aria-hidden className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M8 16L16 8M9 8h7v7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function FlooringWankeCascadeLogo() {
  return (
    <span className="relative block h-[16px] w-[116px] opacity-80 md:h-[23px] md:w-[165px]">
      <img
        alt=""
        aria-hidden="true"
        className="absolute"
        src="/library/partners/flooring/wanke-cascade-part-1.svg"
        style={{ inset: "0.34% 0.11% 29.92% 44.98%" }}
      />
      <img
        alt=""
        aria-hidden="true"
        className="absolute"
        src="/library/partners/flooring/wanke-cascade-part-2.svg"
        style={{ inset: "1.46% 55.84% 28.79% 0.1%" }}
      />
      <img
        alt=""
        aria-hidden="true"
        className="absolute"
        src="/library/partners/flooring/wanke-cascade-part-3.svg"
        style={{ inset: "80.59% 0.63% 4.04% 79.35%" }}
      />
    </span>
  );
}

function FlooringPartnerCard({ logo }: { logo: FlooringPartnerItem }) {
  const cardClassName = [
    "group relative flex min-h-[80px] items-center justify-center overflow-hidden bg-[#262626] px-6 py-5 text-white transition-colors hover:bg-[#202020] md:min-h-[112px]",
    logo.featuredOnMobile ? "col-span-2 md:col-span-1" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content =
    logo.kind === "wankeCascade" ? (
      <FlooringWankeCascadeLogo />
    ) : (
      <FallbackImg
        alt={logo.alt}
        className={`h-auto max-w-full object-contain opacity-80 ${logo.logoClassName || "w-[120px]"}`.trim()}
        data-tina-field={logo.raw ? tinaField(logo.raw as Record<string, unknown>, "logo") : undefined}
        src={logo.src}
        variant="thumb"
      />
    );

  return (
    <a
      className={cardClassName}
      data-tina-field={logo.raw ? tinaField(logo.raw as Record<string, unknown>) : undefined}
      href={logo.href}
      rel="noreferrer noopener"
      target="_blank"
    >
      <span className="absolute right-2 top-2 text-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
        <ExternalArrowIcon />
      </span>
      {content}
    </a>
  );
}

function mapFlooringPartnerLogos(block: Record<string, unknown>): FlooringPartnerItem[] {
  const partnerLogos = mapPartnerLogos(block.partnerLogos);

  if (!partnerLogos.length) {
    return FLOORING_PARTNER_LOGOS;
  }

  return partnerLogos.map((logo, index) => ({
    ...logo,
    featuredOnMobile:
      typeof (logo.raw as { featuredOnMobile?: unknown } | undefined)?.featuredOnMobile === "boolean"
        ? Boolean((logo.raw as { featuredOnMobile?: boolean }).featuredOnMobile)
        : index === partnerLogos.length - 1 && partnerLogos.length % 2 === 1,
    logoClassName: FLOORING_PARTNER_LOGOS.find((item) => item.alt === logo.alt)?.logoClassName,
    kind: logo.alt === "Wanke Cascade" ? "wankeCascade" : "image",
  }));
}

export function FlooringPartnersSection({ block }: { block: Record<string, unknown> }) {
  const partnerLogos = mapFlooringPartnerLogos(block);
  const title = text(block.title, "Our partners");
  const description = text(
    block.description,
    "In addition to the flooring options shown in our catalog, you may also order flooring from the catalogs of the manufacturers listed below. Please discuss availability and details with our manager when placing your order.",
  );
  const footnote = text(
    block.footnote,
    "Click on a partner logo to view their products on the official website.",
  );

  return (
    <section className="bg-[var(--cp-primary-500)] text-white" data-tina-field={tinaField(block)}>
      <div className="cp-container px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto flex max-w-[1349px] flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,558px)_minmax(0,791px)] lg:gap-[57px]">
          <div className="max-w-[361px] lg:max-w-[558px] lg:pt-[84px]">
            <h2
              className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px]"
              data-tina-field={tinaField(block, "title")}
            >
              {title}
            </h2>
            <p
              className="mt-4 text-[18px] leading-[1.5] text-white md:mt-12 md:text-[24px]"
              data-tina-field={tinaField(block, "description")}
            >
              {description}
            </p>
          </div>

          <div className="lg:pt-0">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-7">
              {partnerLogos.map((logo, index) => (
                <FlooringPartnerCard key={`${logo.alt}-${index}`} logo={logo} />
              ))}
            </div>
            {footnote ? (
              <p
                className="mt-5 text-center text-[14px] leading-[1.5] text-white/60"
                data-tina-field={tinaField(block, "footnote")}
              >
                {footnote}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CountertopPartnersSection({ block }: { block: Record<string, unknown> }) {
  const mappedPartnerLogos = mapPartnerLogos(block.partnerLogos);
  const partnerLogos = mappedPartnerLogos.length > 0 ? mappedPartnerLogos : COUNTERTOP_PARTNER_LOGOS;
  const title = text(block.title, "Our partners");
  const description = text(
    block.description,
    "In addition to the countertop options shown in our catalog, you may also order countertops from the catalogs of the manufacturers listed below. Please discuss availability and details with our manager when placing your order.",
  );
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
            <div className="grid grid-cols-2 gap-4 overflow-hidden rounded-[2.78px] md:grid-cols-3 md:gap-7 md:rounded-[4px]">
              {partnerLogos.map((logo, idx) => {
                const raw = logo.raw;
                const href =
                  typeof raw?.url === "string"
                    ? (raw.url as string)
                    : typeof raw?.href === "string"
                      ? (raw.href as string)
                      : logo.href;
                const isLast = idx === partnerLogos.length - 1;
                const logoClass = COUNTERTOP_LOGO_CLASSES[logo.alt] || DEFAULT_COUNTERTOP_LOGO_CLASS;
                const tileClass = [
                  "group relative flex items-center justify-center overflow-hidden bg-[#262626] transition-opacity hover:opacity-90",
                  isLast
                    ? "col-span-2 h-[72px] md:col-span-1 md:h-[112px]"
                    : "h-[80px] md:h-[112px]",
                ].join(" ");

                const logoImg = (
                  <FallbackImg
                    alt={logo.alt}
                    className={logoClass}
                    data-tina-field={raw ? tinaField(raw as Record<string, unknown>, "logo") : undefined}
                    src={logo.src}
                  />
                );
                const arrow = (
                  <span className="pointer-events-none absolute right-2 top-2 text-white">
                    <ExternalArrowIcon />
                  </span>
                );

                if (href) {
                  return (
                    <a
                      aria-label={`${logo.alt} — opens in new tab`}
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

export default function OurPartnersSection({
  block,
  catalogType = "countertop",
}: OurPartnersSectionProps) {
  if (catalogType === "flooring") {
    return <FlooringPartnersSection block={block} />;
  }

  return <CountertopPartnersSection block={block} />;
}
