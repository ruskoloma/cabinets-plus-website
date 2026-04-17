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
}: {
  logo: PartnerLogoItem;
  tinaFieldValue?: string;
  logoField?: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-full w-full items-center justify-center px-4 py-6">
        <FallbackImg
          alt={logo.alt}
          className="max-h-[40px] max-w-full object-contain md:max-h-[48px]"
          data-tina-field={logoField || tinaFieldValue}
          src={logo.src}
          variant="thumb"
        />
      </span>
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-2 h-4 w-4 opacity-80 md:h-6 md:w-6"
        src="/library/icons/arrow-up-right-light.svg"
      />
    </>
  );

  const tileClass = "group relative block h-[80px] bg-[#1e1e1c] transition-colors hover:bg-[#262623] md:h-[112px]";

  if (href) {
    return (
      <a
        className={tileClass}
        data-tina-field={tinaFieldValue}
        href={href}
        rel="noreferrer"
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
  const resolvedLogos = (partnerLogos.length > 0 ? partnerLogos : (fallbackLogos || DEFAULT_FALLBACK_LOGOS)).slice(0, 9);
  const heading = text(block.title, defaultTitle);
  const body = text(block.description, defaultBody);
  const footnote = text(block.footnote, defaultFootnote);

  return (
    <section className="bg-[#262623] text-white" data-tina-field={tinaField(block)}>
      <div className="cp-container px-4 py-12 md:px-8 md:py-[88px]">
        <div className="mx-auto flex max-w-[1378px] flex-col gap-8 md:grid md:grid-cols-[minmax(0,558px)_minmax(0,791px)] md:items-start md:gap-[28px]">
          <div className="flex flex-col">
            <h2
              className="font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-white md:text-[48px]"
              data-tina-field={tinaField(block, "title")}
            >
              {heading}
            </h2>
            <p
              className="mt-6 max-w-[558px] font-[var(--font-red-hat-display)] text-[16px] font-normal leading-[1.5] text-white/90 md:mt-[48px] md:text-[20px]"
              data-tina-field={tinaField(block, "description")}
            >
              {body}
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-0">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-[28px]">
              {resolvedLogos.map((logo, index) => {
                const raw = logo.raw;
                const href = typeof raw?.url === "string" ? (raw.url as string) : undefined;
                return (
                  <PartnerTile
                    href={href}
                    key={`${logo.src}-${index}`}
                    logo={logo}
                    logoField={raw ? tinaField(raw as Record<string, unknown>, "logo") : undefined}
                    tinaFieldValue={raw ? tinaField(raw as Record<string, unknown>) : undefined}
                  />
                );
              })}
            </div>
            {footnote ? (
              <p
                className="mt-6 text-right text-[14px] leading-[1.5] text-white/70 md:mt-8 md:text-[14px]"
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
