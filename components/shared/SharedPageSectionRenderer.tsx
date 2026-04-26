"use client";

import AboutStorySection from "@/components/about/AboutStorySection";
import AboutTrustSection from "@/components/about/AboutTrustSection";
import FAQSectionBlock from "@/components/sections/FAQSectionBlock";
import MiniFAQSectionBlock from "@/components/sections/MiniFAQSectionBlock";
import HeroBlock from "@/components/sections/HeroBlock";
import ProcessSectionBlock from "@/components/sections/ProcessSectionBlock";
import ProductsSectionBlock from "@/components/sections/ProductsSectionBlock";
import ProjectsSectionBlock from "@/components/sections/ProjectsSectionBlock";
import RichContentBlock from "@/components/sections/RichContentBlock";
import ServicesSectionBlock from "@/components/sections/ServicesSectionBlock";
import ShowroomBannerBlock from "@/components/sections/ShowroomBannerBlock";
import WhyUsSectionBlock from "@/components/sections/WhyUsSectionBlock";
import {
  CountertopPartnersSection,
  FlooringPartnersSection,
} from "@/components/shared/OurPartnersSection";
import ContactUsSection from "@/components/shared/ContactUsSection";
import OurShowroomSection from "@/components/shared/OurShowroomSection";
import TrustMessageStrip from "@/components/home/TrustMessageStrip";
import PartnersSection from "@/components/shared/PartnersSection";
import ShowroomBannerSection from "@/components/sections/ShowroomBannerSection";
import TextImageSection from "@/components/sections/TextImageSection";
import { useSharedSections } from "@/components/layout/GlobalContext";
import { resolveSharedSectionBlock } from "@/components/shared/shared-sections";

interface SharedPageSectionRendererProps {
  block: Record<string, unknown>;
  template: string;
}

export default function SharedPageSectionRenderer({
  block,
  template,
}: SharedPageSectionRendererProps) {
  const sharedSections = useSharedSections();
  const resolvedBlock = resolveSharedSectionBlock(block, sharedSections);
  const resolvedTemplate =
    typeof resolvedBlock._template === "string" ? resolvedBlock._template : template;

  switch (resolvedTemplate) {
    case "hero":
      return <HeroBlock block={resolvedBlock} />;
    case "productsSection":
      return <ProductsSectionBlock block={resolvedBlock} />;
    case "servicesSection":
      return <ServicesSectionBlock block={resolvedBlock} />;
    case "projectsSection":
      return <ProjectsSectionBlock block={resolvedBlock} />;
    case "whyUsSection":
      return <WhyUsSectionBlock block={resolvedBlock} />;
    case "features":
      return (
        <WhyUsSectionBlock
          block={{
            ...resolvedBlock,
            features: Array.isArray(resolvedBlock.features) ? resolvedBlock.features : resolvedBlock.items,
          }}
        />
      );
    case "trustStrip":
      return <TrustMessageStrip block={resolvedBlock} />;
    case "aboutSection":
      return <AboutTrustSection block={resolvedBlock} />;
    case "showroomBanner":
      return <ShowroomBannerSection block={resolvedBlock} />;
    case "ctaBanner":
      return (
        <ShowroomBannerBlock
          block={{
            ...resolvedBlock,
            ctaLabel: resolvedBlock.ctaLabel || resolvedBlock.buttonText,
            ctaLink: resolvedBlock.ctaLink || resolvedBlock.buttonLink,
          }}
        />
      );
    case "processSection":
      return <ProcessSectionBlock block={resolvedBlock} />;
    case "faqSection":
      return <FAQSectionBlock block={resolvedBlock} />;
    case "miniFaqSection":
      return <MiniFAQSectionBlock block={resolvedBlock} />;
    case "contactSection":
      return <ContactUsSection block={resolvedBlock} />;
    case "showroomSection":
      return <OurShowroomSection block={resolvedBlock} />;
    case "aboutStorySection":
      return <AboutStorySection block={resolvedBlock} />;
    case "richContent":
      return <RichContentBlock block={resolvedBlock} />;
    case "gallery":
      return <ProjectsSectionBlock block={resolvedBlock} />;
    case "textImageSection":
      return <TextImageSection block={resolvedBlock} />;
    case "partnersSection":
      return <PartnersSection block={resolvedBlock} />;
    case "countertopPartnersSection":
      return <CountertopPartnersSection block={resolvedBlock} />;
    case "flooringPartnersSection":
      return <FlooringPartnersSection block={resolvedBlock} />;
    default:
      return null;
  }
}
