"use client";

import { tinaField } from "tinacms/dist/react";
import { mapPartnerLogos, type PartnerLogoItem } from "@/app/figma-home.helpers";
import FallbackImg from "@/components/ui/FallbackImg";

export interface PartnersSectionBlock {
  title?: unknown;
  description?: unknown;
  footnote?: unknown;
  partnerLogos?: unknown;
}

interface PartnersSectionProps {
  block: Record<string, unknown>;
  fallbackLogos?: PartnerLogoItem[];
  defaultTitle?: string;
  defaultBody?: string;
  defaultFootnote?: string;
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
  Mozaik:
    "w-auto h-auto max-w-[68px] max-h-[39px] md:max-w-[97px] md:max-h-[55px]",
  "Lions Floor":
    "w-auto h-auto max-w-[97px] max-h-[35px] md:max-w-[138px] md:max-h-[50px]",
  "Prima Floors":
    "w-auto h-auto max-w-[104px] max-h-[28px] md:max-w-[148px] md:max-h-[40px]",
  "flooring²":
    "w-auto h-auto max-w-[88px] max-h-[35px] md:max-w-[125px] md:max-h-[50px]",
  MSI: "w-auto h-auto max-w-[76px] max-h-[32px] md:max-w-[110px] md:max-h-[46px]",
  Pacmat:
    "w-auto h-auto max-w-[99px] max-h-[28px] md:max-w-[141px] md:max-h-[40px]",
  Mohawk:
    "w-auto h-auto max-w-[81px] max-h-[26px] md:max-w-[114px] md:max-h-[36px]",
  Stonewood:
    "w-auto h-auto max-w-[103px] max-h-[14px] md:max-w-[147px] md:max-h-[20px]",
  Opus: "w-auto h-auto max-w-[29px] max-h-[35px] md:max-w-[41px] md:max-h-[50px]",
  "Engineered Floors":
    "w-auto h-auto max-w-[95px] max-h-[23px] md:max-w-[136px] md:max-h-[32px]",
};

const DEFAULT_LOGO_CLASS =
  "w-auto h-auto max-h-[40px] max-w-full md:max-h-[60px]";

function WankeCascadeLogo() {
  return (
    <span className="relative block h-[16px] w-[116px] md:h-[23px] md:w-[165px]">
      <span className="absolute" style={{ inset: "0.34% 0.11% 29.92% 44.98%" }}>
        <img
          alt=""
          aria-hidden="true"
          className="block h-full w-full max-w-none"
          src="/library/partners/flooring/wanke-cascade-part-1.svg"
        />
      </span>
      <span className="absolute" style={{ inset: "1.46% 55.84% 28.79% 0.1%" }}>
        <img
          alt=""
          aria-hidden="true"
          className="block h-full w-full max-w-none"
          src="/library/partners/flooring/wanke-cascade-part-2.svg"
        />
      </span>
      <span className="absolute" style={{ inset: "80.59% 0.63% 4.04% 79.35%" }}>
        <img
          alt=""
          aria-hidden="true"
          className="block h-full w-full max-w-none"
          src="/library/partners/flooring/wanke-cascade-part-3.svg"
        />
      </span>
    </span>
  );
}

const DEFAULT_FALLBACK_LOGOS: PartnerLogoItem[] = [
  { src: "/library/trust/trust-cambria.svg", alt: "Cambria" },
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lyrus.png", alt: "Caesarstone" },
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lions-floor.png", alt: "Moda Surfaces" },
  { src: "/library/trust/trust-msi.svg", alt: "MSI" },
  { src: "/library/trust/trust-bedrosians.svg", alt: "Bedrosians" },
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-easy-stones.png", alt: "Daltile" },
];

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function PartnerTile({
  logo,
  tinaFieldValue,
  logoField,
  href,
  spanFullOnMobile,
}: {
  logo: PartnerLogoItem;
  tinaFieldValue?: string;
  logoField?: string;
  href?: string;
  spanFullOnMobile?: boolean;
}) {
  const isCountertopLogo = logo.src.includes("/partners/countertops/");
  const isFlooringLogo = logo.src.includes("/partners/flooring/");
  const isWankeCascade = isFlooringLogo && logo.alt === "Wanke Cascade";
  const logoClass =
    (isCountertopLogo && COUNTERTOP_LOGO_CLASSES[logo.alt]) ||
    (isFlooringLogo && FLOORING_LOGO_CLASSES[logo.alt]) ||
    DEFAULT_LOGO_CLASS;
  const tileClass = [
    "group relative flex items-center justify-center overflow-hidden bg-[#262626] transition-opacity hover:opacity-90",
    spanFullOnMobile
      ? "col-span-2 h-[72px] md:col-span-1 md:h-[112px]"
      : "h-[80px] md:h-[112px]",
  ].join(" ");

  const content = (
    <>
      {isWankeCascade ? (
        <WankeCascadeLogo />
      ) : (
        <FallbackImg
          alt={logo.alt}
          className={logoClass}
          data-tina-field={logoField || tinaFieldValue}
          src={logo.src}
        />
      )}
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-2 h-6 w-6"
        src="/library/icons/arrow-up-right-light.svg"
      />
    </>
  );

  if (href) {
    return (
      <a
        aria-label={`${logo.alt} — opens in new tab`}
        className={tileClass}
        data-tina-field={tinaFieldValue}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <div className={tileClass} data-tina-field={tinaFieldValue}>
      {content}
    </div>
  );
}

export default function PartnersSection({
  block,
  fallbackLogos,
  defaultTitle = "Our partners",
  defaultBody = "In addition to the countertop options shown in our catalog, you may also order countertops from the catalogs of the manufacturers listed below. Please discuss availability and details with our manager when placing your order.",
  defaultFootnote = "Click on a partner logo to view their products on the official website.",
}: PartnersSectionProps) {
  const partnerLogos = mapPartnerLogos(block.partnerLogos);
  const resolvedLogos = partnerLogos.length > 0 ? partnerLogos : (fallbackLogos || DEFAULT_FALLBACK_LOGOS);
  const heading = text(block.title, defaultTitle);
  const body = text(block.description, defaultBody);
  const footnote = text(block.footnote, defaultFootnote);
  const lastIndex = resolvedLogos.length - 1;
  const oddCount = resolvedLogos.length % 2 === 1;

  return (
    <section className="bg-[var(--cp-primary-500)] text-white" data-tina-field={tinaField(block)}>
      <div className="cp-container px-4 py-12 md:px-8 md:py-[92px]">
        <div className="mx-auto flex max-w-[1378px] flex-col gap-8 md:grid md:grid-cols-[minmax(0,558px)_minmax(0,791px)] md:items-start md:gap-[28px]">
          <div className="flex flex-col md:pt-[52px]">
            <h2
              className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px]"
              data-tina-field={tinaField(block, "title")}
            >
              {heading}
            </h2>
            <p
              className="mt-4 font-[var(--font-red-hat-display)] text-[18px] font-normal leading-[1.5] text-white md:mt-12 md:text-[24px]"
              data-tina-field={tinaField(block, "description")}
            >
              {body}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 overflow-hidden rounded-[2.78px] md:grid-cols-3 md:gap-7 md:rounded-[4px]">
              {resolvedLogos.map((logo, index) => {
                const raw = logo.raw;
                const href = typeof raw?.url === "string" ? (raw.url as string) : undefined;
                return (
                  <PartnerTile
                    href={href}
                    key={`${logo.src}-${index}`}
                    logo={logo}
                    logoField={raw ? tinaField(raw as Record<string, unknown>, "logo") : undefined}
                    spanFullOnMobile={oddCount && index === lastIndex}
                    tinaFieldValue={raw ? tinaField(raw as Record<string, unknown>) : undefined}
                  />
                );
              })}
            </div>
            {footnote ? (
              <p
                className="text-center font-[var(--font-red-hat-display)] text-[14px] font-normal leading-[1.5] text-white/60"
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
