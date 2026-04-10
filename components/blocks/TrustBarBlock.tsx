import { tinaField } from "tinacms/dist/react";
import TrustBar from "@/components/home/TrustBar";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export default function TrustBarBlock({ block }: { block: BlockRecord }) {
  const blockRecord = block as Record<string, unknown>;
  const rawStats = asBlockArray(block.stats);
  const rawPartnerLogos = asBlockArray(block.partnerLogos);

  const stats = rawStats.map((stat) => ({
    value: text(stat.value),
    label: text(stat.label),
    tinaField: tinaField(stat as Record<string, unknown>),
    valueField: tinaField(stat as Record<string, unknown>, "value"),
    labelField: tinaField(stat as Record<string, unknown>, "label"),
  }));

  const partnerLogos = rawPartnerLogos.map((logo) => ({
    src: text(logo.logo),
    alt: text(logo.alt, "Partner logo"),
    tinaField: tinaField(logo as Record<string, unknown>),
    logoField: tinaField(logo as Record<string, unknown>, "logo"),
  }));

  return (
    <TrustBar
      ctaLabel={text(block.ctaLabel, "About us")}
      ctaLabelField={tinaField(blockRecord, "ctaLabel")}
      ctaLink={text(block.ctaLink, "/about-us")}
      membershipLabel={text(block.membershipLabel, "Membership")}
      membershipLabelField={tinaField(blockRecord, "membershipLabel")}
      membershipLogo={text(block.membershipDesktopLogo, "/library/trust/trust-membership.svg")}
      membershipLogoField={tinaField(blockRecord, "membershipDesktopLogo")}
      membershipMobileBottomLogo={text(block.membershipMobileBottomLogo, "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-membership-mobile-bottom.png")}
      membershipMobileBottomLogoField={tinaField(blockRecord, "membershipMobileBottomLogo")}
      membershipMobileTopLogo={text(block.membershipMobileTopLogo, "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-shba.png")}
      membershipMobileTopLogoField={tinaField(blockRecord, "membershipMobileTopLogo")}
      partnerLogos={partnerLogos}
      partnershipLabel={text(block.partnershipLabel, "Exclusive Partnership")}
      partnershipLabelField={tinaField(blockRecord, "partnershipLabel")}
      stats={stats}
    />
  );
}
