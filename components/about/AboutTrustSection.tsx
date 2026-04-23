"use client";

import { tinaField } from "tinacms/dist/react";
import {
  mapPartnerLogos,
  mapStats,
  toBlockArray,
  type PartnerLogoItem,
} from "@/app/figma-home.helpers";
import TrustBar from "@/components/home/TrustBar";

interface AboutTrustSectionProps {
  block: Record<string, unknown>;
}

const FALLBACK_TRUST_PARTNER_LOGOS: PartnerLogoItem[] = [
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lions-floor.png", alt: "Lions Floor" },
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lyrus.png", alt: "Lyrus Collection" },
  { src: "/library/trust/trust-cambria.svg", alt: "Cambria" },
  { src: "/library/trust/trust-bedrosians.svg", alt: "Bedrosians" },
  { src: "/library/trust/trust-msi.svg", alt: "MSI" },
  { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-easy-stones.png", alt: "Easy Stones" },
];

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export default function AboutTrustSection({ block }: AboutTrustSectionProps) {
  const statsItems = mapStats(toBlockArray(block.stats)).slice(0, 3);
  const partnerLogos = mapPartnerLogos(block.partnerLogos);
  const trustPartnerLogos = (partnerLogos.length > 0 ? partnerLogos : FALLBACK_TRUST_PARTNER_LOGOS).map((logo) => {
    const raw = logo.raw;
    return {
      ...logo,
      tinaField: raw ? tinaField(raw as Record<string, unknown>) : undefined,
      logoField: raw ? tinaField(raw as Record<string, unknown>, "logo") : undefined,
    };
  });
  const trustStats = statsItems.map((stat) => ({
    ...stat,
    tinaField: tinaField(stat.raw as Record<string, unknown>),
    valueField: tinaField(stat.raw as Record<string, unknown>, "value"),
    labelField: tinaField(stat.raw as Record<string, unknown>, "label"),
  }));

  return (
    <div data-tina-field={tinaField(block)}>
      <TrustBar
        ctaLabel={text(block.ctaLabel)}
        ctaLabelField={tinaField(block, "ctaLabel")}
        ctaLink={text(block.ctaLink)}
        membershipLabel={text(block.membershipLabel, "Membership")}
        membershipLabelField={tinaField(block, "membershipLabel")}
        membershipLogo={text(block.membershipDesktopLogo, "/library/trust/trust-membership.svg")}
        membershipLogoField={tinaField(block, "membershipDesktopLogo")}
        membershipMobileBottomLogo={text(block.membershipMobileBottomLogo, "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-membership-mobile-bottom.png")}
        membershipMobileBottomLogoField={tinaField(block, "membershipMobileBottomLogo")}
        membershipMobileTopLogo={text(block.membershipMobileTopLogo, "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-shba.png")}
        membershipMobileTopLogoField={tinaField(block, "membershipMobileTopLogo")}
        partnerLogos={trustPartnerLogos}
        partnershipLabel={text(block.partnershipLabel, "Exclusive Partnership")}
        partnershipLabelField={tinaField(block, "partnershipLabel")}
        stats={trustStats}
      />
    </div>
  );
}
