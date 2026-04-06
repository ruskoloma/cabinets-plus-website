"use client";

import { Fragment } from "react";
import { tinaField, useTina } from "tinacms/dist/react";
import {
  mapPartnerLogos,
  mapStats,
  resolveTemplateName,
  text,
  toBlockArray,
  type HomeBlock,
  type PartnerLogoItem,
} from "@/app/figma-home.helpers";
import AboutHeroSection from "@/components/about/AboutHeroSection";
import AboutStorySection from "@/components/about/AboutStorySection";
import FAQSectionBlock from "@/components/blocks/FAQSectionBlock";
import RichContentBlock from "@/components/blocks/RichContentBlock";
import ContactUsSection from "@/components/home/ContactUsSection";
import OurShowroomSection from "@/components/home/OurShowroomSection";
import TrustBar from "@/components/home/TrustBar";
import TrustMessageStrip from "@/components/home/TrustMessageStrip";

interface AboutPageClientProps {
  data: { page?: { blocks?: unknown[] | null } | null };
  query?: string;
  variables?: Record<string, unknown>;
}

function renderAboutTrustBar(block: Record<string, unknown>) {
  const statsItems = mapStats(toBlockArray(block.stats)).slice(0, 3);
  const partnerLogos = mapPartnerLogos(block.partnerLogos);
  const fallbackTrustPartnerLogos: PartnerLogoItem[] = [
    { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lions-floor.png", alt: "Lions Floor" },
    { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-lyrus.png", alt: "Lyrus Collection" },
    { src: "/library/trust/trust-cambria.svg", alt: "Cambria" },
    { src: "/library/trust/trust-bedrosians.svg", alt: "Bedrosians" },
    { src: "/library/trust/trust-msi.svg", alt: "MSI" },
    { src: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-easy-stones.png", alt: "Easy Stones" },
  ];
  const trustPartnerLogos = (partnerLogos.length > 0 ? partnerLogos : fallbackTrustPartnerLogos).map((logo) => {
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

function renderBlock(block: HomeBlock, index: number) {
  const template = resolveTemplateName(block);
  const blockRecord = block as Record<string, unknown>;

  switch (template) {
    case "hero":
      return <AboutHeroSection block={blockRecord} key={`about-block-${template}-${index}`} />;
    case "aboutStorySection":
      return <AboutStorySection block={blockRecord} key={`about-block-${template}-${index}`} />;
    case "trustStrip":
      return <TrustMessageStrip block={blockRecord} key={`about-block-${template}-${index}`} />;
    case "aboutSection":
      return <Fragment key={`about-block-${template}-${index}`}>{renderAboutTrustBar(blockRecord)}</Fragment>;
    case "contactSection":
      return (
        <Fragment key={`about-block-${template}-${index}`}>
          <ContactUsSection block={blockRecord} />
          <OurShowroomSection block={blockRecord} />
        </Fragment>
      );
    case "faqSection":
      return <FAQSectionBlock block={block} key={`about-block-${template}-${index}`} />;
    case "richContent":
      return <RichContentBlock block={block} key={`about-block-${template}-${index}`} />;
    default:
      console.warn(`Unsupported about page block type: ${template || "unknown"}`);
      return null;
  }
}

function renderPage(blocks: ReturnType<typeof toBlockArray>) {
  return <div className="flex flex-col bg-white text-[var(--cp-primary-500)]">{blocks.map(renderBlock)}</div>;
}

function TinaAboutPageClient(props: AboutPageClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  return renderPage(toBlockArray(data.page?.blocks));
}

export default function AboutPageClient(props: AboutPageClientProps) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return renderPage(toBlockArray(props.data?.page?.blocks));
  }

  return <TinaAboutPageClient {...props} />;
}
