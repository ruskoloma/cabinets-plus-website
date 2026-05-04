function buildSharedPageSettingsBlockFragments(prefix: string) {
  return `
          ... on ${prefix}Hero {
            heading
            subtext
            ctaLabel
            ctaLink
            backgroundImage
            imageSize
          }
          ... on ${prefix}ProductsSection {
            title
            ctaLabel
            ctaLink
            imageSize
            products {
              name
              image
              link
            }
          }
          ... on ${prefix}ServicesSection {
            title
            imageSize
            services {
              title
              description
              image
              link
            }
          }
          ... on ${prefix}ProjectsSection {
            title
            ctaLabel
            ctaLink
            projects {
              project {
                ... on Project {
                  title
                  media {
                    file
                  }
                  _sys {
                    filename
                    relativePath
                  }
                }
              }
              imageOverride
            }
            imageSize
          }
          ... on ${prefix}WhyUsSection {
            title
            text1
            text2
            imageSize
            features {
              icon
              title
              description
              image
            }
          }
          ... on ${prefix}TrustStrip {
            trustStripContent
            trustStripTexture
          }
          ... on ${prefix}AboutSection {
            stats {
              value
              label
            }
            membershipDesktopLogo
            membershipMobileTopLogo
            membershipMobileBottomLogo
            membershipLabel
            partnershipLabel
            partnerLogos {
              logo
              alt
              href
            }
            ctaLabel
            ctaLink
          }
          ... on ${prefix}ShowroomBanner {
            heading
            subtext
            ctaLabel
            ctaLink
            image
            imageSize
          }
          ... on ${prefix}ProcessSection {
            title
            steps {
              number
              iconImage
              title
              description
              icon
            }
          }
          ... on ${prefix}FaqSection {
            title
            tabs {
              label
              faqs {
                question
                answer
              }
            }
            faqs {
              question
              answer
            }
          }
          ... on ${prefix}MiniFaqSection {
            title
            faqs {
              question
              answer
            }
          }
          ... on ${prefix}ContactSection {
            title
            image
            imageSize
            nameLabel
            namePlaceholder
            emailLabel
            emailPlaceholder
            messageLabel
            messagePlaceholder
            submitLabel
          }
          ... on ${prefix}ShowroomSection {
            showroomTitle
            followUsLabel
            mapEmbedUrl
          }
          ... on ${prefix}AboutStorySection {
            title
            body
          }
          ... on ${prefix}RichContent {
            title
            body
          }
          ... on ${prefix}ArticleContentSection {
            breadcrumbLabel
            title
            subtitle
            body
          }
          ... on ${prefix}MagazineEmbed {
            heading
            subheading
            embedUrl
            height
            iframeTitle
          }
          ... on ${prefix}TextImageSection {
            title
            paragraphs
            image
            imagePosition
            ctaLabel
            ctaLink
          }
          ... on ${prefix}PartnersSection {
            title
            description
            footnote
            partnerLogos {
              logo
              alt
              url
            }
          }
          ... on ${prefix}CountertopPartnersSection {
            title
            description
            footnote
            partnerLogos {
              logo
              alt
              url
            }
          }
          ... on ${prefix}FlooringPartnersSection {
            title
            description
            footnote
            partnerLogos {
              logo
              alt
              url
            }
          }
          ... on ${prefix}RelatedArticlesSection {
            title
            imageSize
            posts {
              post {
                ... on Post {
                  _sys {
                    filename
                    relativePath
                  }
                }
              }
            }
          }`;
}

const STATIC_PAGE_QUERY_TEMPLATES = [
  { templateTypename: "PagesHomePage", blocksTypenamePrefix: "PagesHomePageBlocks" },
  { templateTypename: "PagesAboutPage", blocksTypenamePrefix: "PagesAboutPageBlocks" },
  { templateTypename: "PagesContactPage", blocksTypenamePrefix: "PagesContactPageBlocks" },
  { templateTypename: "PagesPrivacyPolicyPage", blocksTypenamePrefix: "PagesPrivacyPolicyPageBlocks" },
  { templateTypename: "PagesMagazinePage", blocksTypenamePrefix: "PagesMagazinePageBlocks" },
];

export const PAGE_QUERY = `
  query PageDocument($relativePath: String!) {
    page: pages(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
${STATIC_PAGE_QUERY_TEMPLATES.map(
  ({ templateTypename, blocksTypenamePrefix }) => `
      ... on ${templateTypename} {
        title
        seo {
          title
          description
          ogImage
        }
        blocks {
          __typename
${buildSharedPageSettingsBlockFragments(blocksTypenamePrefix)}
        }
      }`,
).join("")}
    }
  }
`;

function buildServiceMainPageSettingsQuery({
  operationName,
  resultKey,
  templateTypename,
  blocksTypenamePrefix,
}: {
  operationName: string;
  resultKey: string;
  templateTypename: string;
  blocksTypenamePrefix: string;
}) {
  return `
  query ${operationName}($relativePath: String!) {
    ${resultKey}: pages(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on ${templateTypename} {
        title
        seo {
          title
          description
          ogImage
        }
        blocks {
          __typename
${buildSharedPageSettingsBlockFragments(blocksTypenamePrefix)}
        }
      }
    }
  }
`;
}

export const CABINETS_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "CabinetsMainPageSettingsDocument",
  resultKey: "cabinetsMainPageSettings",
  templateTypename: "PagesCabinetsMainPage",
  blocksTypenamePrefix: "PagesCabinetsMainPageBlocks",
});

export const COUNTERTOPS_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "CountertopsMainPageSettingsDocument",
  resultKey: "countertopsMainPageSettings",
  templateTypename: "PagesCountertopsMainPage",
  blocksTypenamePrefix: "PagesCountertopsMainPageBlocks",
});

export const FLOORING_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "FlooringMainPageSettingsDocument",
  resultKey: "flooringMainPageSettings",
  templateTypename: "PagesFlooringMainPage",
  blocksTypenamePrefix: "PagesFlooringMainPageBlocks",
});

export const KITCHEN_REMODEL_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "KitchenRemodelMainPageSettingsDocument",
  resultKey: "kitchenRemodelMainPageSettings",
  templateTypename: "PagesKitchenRemodelMainPage",
  blocksTypenamePrefix: "PagesKitchenRemodelMainPageBlocks",
});

export const BATHROOM_REMODEL_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "BathroomRemodelMainPageSettingsDocument",
  resultKey: "bathroomRemodelMainPageSettings",
  templateTypename: "PagesBathroomRemodelMainPage",
  blocksTypenamePrefix: "PagesBathroomRemodelMainPageBlocks",
});

export const GLASS_ENCLOSURES_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "GlassEnclosuresMainPageSettingsDocument",
  resultKey: "glassEnclosuresMainPageSettings",
  templateTypename: "PagesGlassEnclosuresMainPage",
  blocksTypenamePrefix: "PagesGlassEnclosuresMainPageBlocks",
});

export const CABINETS_OVERVIEW_PAGE_SETTINGS_QUERY = `
  query CabinetsOverviewPageSettingsDocument($relativePath: String!) {
    cabinetsOverviewPageSettings: pages(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PagesCabinetsOverview {
        blocks {
          __typename
          ... on PagesCabinetsOverviewBlocksCabinetCatalogGrid {
            pageTitle
            pageSubtitle
            cardImageSize
            filterImageSize
          }
${buildSharedPageSettingsBlockFragments("PagesCabinetsOverviewBlocks")}
        }
      }
    }
  }
`;

export const COUNTERTOPS_OVERVIEW_PAGE_SETTINGS_QUERY = `
  query CountertopsOverviewPageSettingsDocument($relativePath: String!) {
    countertopsOverviewPageSettings: pages(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PagesCountertopsOverview {
        blocks {
          __typename
          ... on PagesCountertopsOverviewBlocksCountertopCatalogGrid {
            pageTitle
            pageSubtitle
            cardImageSize
            filterImageSize
          }
${buildSharedPageSettingsBlockFragments("PagesCountertopsOverviewBlocks")}
        }
      }
    }
  }
`;

export const FLOORING_OVERVIEW_PAGE_SETTINGS_QUERY = `
  query FlooringOverviewPageSettingsDocument($relativePath: String!) {
    flooringOverviewPageSettings: pages(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PagesFlooringOverview {
        blocks {
          __typename
          ... on PagesFlooringOverviewBlocksFlooringCatalogGrid {
            pageTitle
            pageSubtitle
            cardImageSize
            filterImageSize
          }
${buildSharedPageSettingsBlockFragments("PagesFlooringOverviewBlocks")}
        }
      }
    }
  }
`;

export const GALLERY_PAGE_SETTINGS_QUERY = `
  query GalleryPageSettingsDocument($relativePath: String!) {
    galleryPageSettings: pages(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PagesGallery {
        title
        seo {
          title
          description
          ogImage
        }
        blocks {
          __typename
          ... on PagesGalleryBlocksGalleryProjectGrid {
            pageTitle
            galleryOverviewProjectCardImageSize
            galleryOverviewFilterImageSize
            specialityTitle
            specialityEnabled
            specialityCardImageSize
          }
${buildSharedPageSettingsBlockFragments("PagesGalleryBlocks")}
        }
      }
    }
  }
`;

export const BLOG_PAGE_SETTINGS_QUERY = `
  query BlogPageSettingsDocument($relativePath: String!) {
    blogPageSettings: pages(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PagesBlog {
        title
        seo {
          title
          description
          ogImage
        }
        blocks {
          __typename
          ... on PagesBlogBlocksBlogPostsGrid {
            pageTitle
            postsPerPage
            postCardImageSize
          }
${buildSharedPageSettingsBlockFragments("PagesBlogBlocks")}
        }
      }
    }
  }
`;

export const PROJECT_PAGE_SETTINGS_QUERY = `
  query ProjectPageSettingsDocument($relativePath: String!) {
    projectPageSettings: templates(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on TemplatesProject {
        blocks {
          __typename
          ... on TemplatesProjectBlocksProjectInfo {
            breadcrumbLabel
            breadcrumbLink
            galleryImageSize
            lightboxImageSize
          }
          ... on TemplatesProjectBlocksProjectMaterials {
            title
            cabinetTitle
            cabinetPlaceholder
            countertopTitle
            countertopPlaceholder
            flooringTitle
            flooringPlaceholder
            imageSize
          }
          ... on TemplatesProjectBlocksProjectRelatedProjects {
            title
            ctaLabel
            ctaLink
            imageSize
          }
${buildSharedPageSettingsBlockFragments("TemplatesProjectBlocks")}
        }
      }
    }
  }
`;

export const COLLECTION_PAGE_SETTINGS_QUERY = `
  query CollectionPageSettingsDocument($relativePath: String!) {
    collectionPageSettings: templates(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on TemplatesCollection {
        blocks {
          __typename
          ... on TemplatesCollectionBlocksCollectionInfo {
            breadcrumbLabel
            breadcrumbLink
            galleryImageSize
            lightboxImageSize
          }
          ... on TemplatesCollectionBlocksCollectionRelatedProjects {
            title
            ctaLabel
            ctaLink
            imageSize
          }
${buildSharedPageSettingsBlockFragments("TemplatesCollectionBlocks")}
        }
      }
    }
  }
`;

export const POST_PAGE_SETTINGS_QUERY = `
  query PostPageSettingsDocument($relativePath: String!) {
    postPageSettings: templates(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on TemplatesPost {
        title
        seo {
          title
          description
          ogImage
        }
        blocks {
          __typename
          ... on TemplatesPostBlocksPostContent {
            breadcrumbLabel
            heroImageSize
          }
          ... on TemplatesPostBlocksPostRelatedArticles {
            title
            imageSize
          }
${buildSharedPageSettingsBlockFragments("TemplatesPostBlocks")}
        }
      }
    }
  }
`;

export const CABINET_PAGE_SETTINGS_QUERY = `
  query CabinetPageSettingsDocument($relativePath: String!) {
    cabinetPageSettings: templates(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on TemplatesCabinet {
        blocks {
          __typename
          ... on TemplatesCabinetBlocksCabinetProductInfo {
            breadcrumbLabel
            technicalDetailsTitle
            contactButtonLabel
            descriptionLabel
            galleryThumbImageSize
            galleryMainImageSize
            galleryLightboxImageSize
          }
          ... on TemplatesCabinetBlocksProjectsUsingThisProduct {
            title
            description
            imageSize
          }
          ... on TemplatesCabinetBlocksRelatedProducts {
            title
            subtitle
            imageSize
          }
${buildSharedPageSettingsBlockFragments("TemplatesCabinetBlocks")}
        }
      }
    }
  }
`;

export const COUNTERTOP_PAGE_SETTINGS_QUERY = `
  query CountertopPageSettingsDocument($relativePath: String!) {
    countertopPageSettings: templates(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on TemplatesCountertop {
        blocks {
          __typename
          ... on TemplatesCountertopBlocksCountertopProductInfo {
            breadcrumbLabel
            technicalDetailsTitle
            contactButtonLabel
            descriptionLabel
            galleryThumbImageSize
            galleryMainImageSize
            galleryLightboxImageSize
          }
          ... on TemplatesCountertopBlocksProjectsUsingThisProduct {
            title
            description
            imageSize
          }
          ... on TemplatesCountertopBlocksRelatedProducts {
            title
            subtitle
            imageSize
          }
${buildSharedPageSettingsBlockFragments("TemplatesCountertopBlocks")}
        }
      }
    }
  }
`;

export const FLOORING_PAGE_SETTINGS_QUERY = `
  query FlooringPageSettingsDocument($relativePath: String!) {
    flooringPageSettings: templates(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on TemplatesFlooring {
        blocks {
          __typename
          ... on TemplatesFlooringBlocksFlooringProductInfo {
            breadcrumbLabel
            technicalDetailsTitle
            contactButtonLabel
            descriptionLabel
            galleryThumbImageSize
            galleryMainImageSize
            galleryLightboxImageSize
          }
          ... on TemplatesFlooringBlocksProjectsUsingThisProduct {
            title
            description
            imageSize
          }
          ... on TemplatesFlooringBlocksRelatedProducts {
            title
            subtitle
            imageSize
          }
${buildSharedPageSettingsBlockFragments("TemplatesFlooringBlocks")}
        }
      }
    }
  }
`;
