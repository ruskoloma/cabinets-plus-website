"use client";

import { tinaField } from "tinacms/dist/react";
import AboutStorySection from "@/components/about/AboutStorySection";
import AboutTrustSection from "@/components/about/AboutTrustSection";
import ArticleContentSection from "@/components/sections/ArticleContentSection";
import FAQSectionBlock from "@/components/sections/FAQSectionBlock";
import MiniFAQSectionBlock from "@/components/sections/MiniFAQSectionBlock";
import HeroBlock from "@/components/sections/HeroBlock";
import ProcessSectionBlock from "@/components/sections/ProcessSectionBlock";
import ProductsSectionBlock from "@/components/sections/ProductsSectionBlock";
import ProjectsSectionBlock from "@/components/sections/ProjectsSectionBlock";
import RelatedArticlesSection from "@/components/sections/RelatedArticlesSection";
import RichContentBlock from "@/components/sections/RichContentBlock";
import MagazineEmbedSection from "@/components/sections/MagazineEmbedSection";
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
import { useRelatedPosts } from "@/components/sections/related-posts-context";
import { useSharedSections } from "@/components/layout/GlobalContext";
import { TINA_LIST_KEY_RELATED_ARTICLES_SECTION } from "@/lib/tina-list-focus";
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
  const relatedPosts = useRelatedPosts();
  const resolvedBlock = resolveSharedSectionBlock(block, sharedSections);
  const resolvedTemplate =
    typeof resolvedBlock._template === "string" ? resolvedBlock._template : template;

  const renderRelatedArticles = () => {
    const selections = Array.isArray(resolvedBlock.posts)
      ? (resolvedBlock.posts as ReadonlyArray<{ post?: string | Record<string, unknown> | null } | null>)
      : null;
    return (
      <RelatedArticlesSection
        block={resolvedBlock}
        focusListKey={TINA_LIST_KEY_RELATED_ARTICLES_SECTION}
        focusRootFieldName={tinaField(resolvedBlock, "posts") || undefined}
        posts={relatedPosts}
        resolveSelectionField={(index) =>
          tinaField(resolvedBlock, `posts.${index}.post`) || undefined
        }
        selections={selections}
      />
    );
  };

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
    case "articleContentSection":
      return <ArticleContentSection block={resolvedBlock} />;
    case "magazineEmbed":
      return <MagazineEmbedSection block={resolvedBlock} />;
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
    case "relatedArticlesSection":
      return renderRelatedArticles();
    default:
      return null;
  }
}
