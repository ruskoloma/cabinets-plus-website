"use client";

import { tinaField } from "tinacms/dist/react";
import FallbackImg from "@/components/ui/FallbackImg";

interface PartnerLogoItem {
  raw?: Record<string, unknown>;
  src: string;
  alt: string;
  href?: string;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function mapPartnerLogos(value: unknown): PartnerLogoItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { src: item, alt: "Partner logo" };
      const raw = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        raw,
        src: text(raw.logo),
        alt: text(raw.alt, "Partner logo"),
        href: text(raw.href) || undefined,
      };
    })
    .filter((item) => item.src.length > 0);
}

interface OurPartnersSectionProps {
  block: Record<string, unknown>;
  catalogType?: "countertop" | "flooring";
}

interface FlooringPartnerItem extends PartnerLogoItem {
  featuredOnMobile?: boolean;
  logoClassName?: string;
  kind?: "image" | "wankeCascade";
}

const FALLBACK_PARTNER_LOGOS: PartnerLogoItem[] = [
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lions-floor.png", alt: "Lions Floor" },
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lyrus.png", alt: "Lyrus Collection" },
  { src: "/library/trust/trust-cambria.svg", alt: "Cambria" },
  { src: "/library/trust/trust-bedrosians.svg", alt: "Bedrosians" },
  { src: "/library/trust/trust-msi.svg", alt: "MSI" },
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-easy-stones.png", alt: "Easy Stones" },
];

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
        src={logo.src}
        variant="thumb"
      />
    );

  return (
    <a className={cardClassName} href={logo.href} rel="noreferrer noopener" target="_blank">
      <span className="absolute right-2 top-2 text-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
        <ExternalArrowIcon />
      </span>
      {content}
    </a>
  );
}

function FlooringPartnersSection({ block }: { block: Record<string, unknown> }) {
  return (
    <section className="bg-[var(--cp-primary-500)] text-white" data-tina-field={tinaField(block)}>
      <div className="cp-container px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto flex max-w-[1349px] flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,558px)_minmax(0,791px)] lg:gap-[57px]">
          <div className="max-w-[361px] lg:max-w-[558px] lg:pt-[84px]">
            <h2 className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px]">
              Our partners
            </h2>
            <p className="mt-4 text-[18px] leading-[1.5] text-white md:mt-12 md:text-[24px]">
              In addition to the flooring options shown in our catalog, you may also order flooring from
              the catalogs of the manufacturers listed below. Please discuss availability and details with
              our manager when placing your order.
            </p>
          </div>

          <div className="lg:pt-0">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-7">
              {FLOORING_PARTNER_LOGOS.map((logo) => (
                <FlooringPartnerCard key={logo.alt} logo={logo} />
              ))}
            </div>
            <p className="mt-5 text-center text-[14px] leading-[1.5] text-white/60">
              Click on a partner logo to view their products on the official website.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DefaultPartnersSection({ block }: { block: Record<string, unknown> }) {
  const partnerLogos = mapPartnerLogos(block.partnerLogos);
  const resolvedLogos = (partnerLogos.length > 0 ? partnerLogos : FALLBACK_PARTNER_LOGOS).slice(0, 6);

  return (
    <section className="bg-[var(--cp-primary-500)] text-white" data-tina-field={tinaField(block)}>
      <div className="cp-container px-4 py-14 md:px-8 md:py-24">
        <div className="mx-auto flex max-w-[1378px] flex-col gap-10 md:grid md:grid-cols-[minmax(0,558px)_1px_minmax(0,679px)] md:items-center md:gap-[44px]">
          <div>
            <h2 className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px]">
              Our partners
            </h2>
            <p className="mt-8 max-w-[558px] font-[var(--font-red-hat-display)] text-[20px] font-normal leading-[1.5] text-white md:text-[24px]">
              In addition to the countertop options shown in this catalog, you may also order countertops
              from the catalogs of the manufacturers listed below. Please discuss availability and details
              with our manager when placing your order.
            </p>
          </div>

          <div className="h-px w-full bg-white/20 md:h-[392px] md:w-px" />

          <div className="grid grid-cols-2 items-center gap-x-8 gap-y-10 opacity-40 md:grid-cols-3 md:gap-x-16 md:gap-y-14">
            {resolvedLogos.map((logo, index) => {
              const raw = logo.raw;

              return (
                <div
                  className="flex min-h-[56px] items-center justify-start md:min-h-[70px]"
                  data-tina-field={raw ? tinaField(raw as Record<string, unknown>) : undefined}
                  key={`${logo.src}-${index}`}
                >
                  <FallbackImg
                    alt={logo.alt}
                    className="max-h-[55px] w-auto max-w-full object-contain md:max-h-[80px]"
                    data-tina-field={raw ? tinaField(raw as Record<string, unknown>, "logo") : undefined}
                    src={logo.src}
                    variant="thumb"
                  />
                </div>
              );
            })}
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

  return <DefaultPartnersSection block={block} />;
}
