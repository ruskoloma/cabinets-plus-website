"use client";

import { tinaField } from "tinacms/dist/react";
import { mapPartnerLogos, type PartnerLogoItem } from "@/app/figma-home.helpers";
import FallbackImg from "@/components/ui/FallbackImg";

interface OurPartnersSectionProps {
  block: Record<string, unknown>;
}

const FALLBACK_PARTNER_LOGOS: PartnerLogoItem[] = [
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lions-floor.png", alt: "Lions Floor" },
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lyrus.png", alt: "Lyrus Collection" },
  { src: "/library/trust/trust-cambria.svg", alt: "Cambria" },
  { src: "/library/trust/trust-bedrosians.svg", alt: "Bedrosians" },
  { src: "/library/trust/trust-msi.svg", alt: "MSI" },
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-easy-stones.png", alt: "Easy Stones" },
];

export default function OurPartnersSection({ block }: OurPartnersSectionProps) {
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
