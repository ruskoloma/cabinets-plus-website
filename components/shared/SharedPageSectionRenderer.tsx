"use client";

import AboutStorySection from "@/components/about/AboutStorySection";
import AboutTrustSection from "@/components/about/AboutTrustSection";
import FAQSectionBlock from "@/components/blocks/FAQSectionBlock";
import HeroBlock from "@/components/blocks/HeroBlock";
import ProcessSectionBlock from "@/components/blocks/ProcessSectionBlock";
import ProductsSectionBlock from "@/components/blocks/ProductsSectionBlock";
import ProjectsSectionBlock from "@/components/blocks/ProjectsSectionBlock";
import RichContentBlock from "@/components/blocks/RichContentBlock";
import ServicesSectionBlock from "@/components/blocks/ServicesSectionBlock";
import WhyUsSectionBlock from "@/components/blocks/WhyUsSectionBlock";
import {
  CountertopPartnersSection,
  FlooringPartnersSection,
} from "@/components/catalog-overview/OurPartnersSection";
import ContactUsSection from "@/components/home/ContactUsSection";
import OurShowroomSection from "@/components/home/OurShowroomSection";
import TrustMessageStrip from "@/components/home/TrustMessageStrip";
import PartnersSection from "@/components/shared/PartnersSection";
import ShowroomBannerSection from "@/components/shared/ShowroomBannerSection";
import TextImageSection from "@/components/shared/TextImageSection";

interface SharedPageSectionRendererProps {
  block: Record<string, unknown>;
  template: string;
  contactMode?: "form" | "formAndShowroom";
}

export default function SharedPageSectionRenderer({
  block,
  template,
  contactMode = "form",
}: SharedPageSectionRendererProps) {
  switch (template) {
    case "hero":
      return <HeroBlock block={block} />;
    case "productsSection":
      return <ProductsSectionBlock block={block} />;
    case "servicesSection":
      return <ServicesSectionBlock block={block} />;
    case "projectsSection":
      return <ProjectsSectionBlock block={block} />;
    case "whyUsSection":
      return <WhyUsSectionBlock block={block} />;
    case "trustStrip":
      return <TrustMessageStrip block={block} />;
    case "aboutSection":
      return <AboutTrustSection block={block} />;
    case "showroomBanner":
      return <ShowroomBannerSection block={block} />;
    case "processSection":
      return <ProcessSectionBlock block={block} />;
    case "faqSection":
      return <FAQSectionBlock block={block} />;
    case "contactSection":
      return contactMode === "formAndShowroom" ? (
        <>
          <ContactUsSection block={block} />
          <OurShowroomSection block={block} />
        </>
      ) : (
        <ContactUsSection block={block} />
      );
    case "aboutStorySection":
      return <AboutStorySection block={block} />;
    case "richContent":
      return <RichContentBlock block={block} />;
    case "textImageSection":
      return <TextImageSection block={block} />;
    case "partnersSection":
      return <PartnersSection block={block} />;
    case "countertopPartnersSection":
      return <CountertopPartnersSection block={block} />;
    case "flooringPartnersSection":
      return <FlooringPartnersSection block={block} />;
    default:
      return null;
  }
}
