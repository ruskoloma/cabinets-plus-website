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
            subtitle
            introText
            introText2
            imageSize
            features {
              icon
              title
              description
              image
            }
          }
          ... on ${prefix}TrustStrip {
            trustStripText
            trustStripHighlight
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
          }`;
}

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
    ${resultKey}: pageSettings(relativePath: $relativePath) {
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
  templateTypename: "PageSettingsCabinetsMainPage",
  blocksTypenamePrefix: "PageSettingsCabinetsMainPageBlocks",
});

export const COUNTERTOPS_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "CountertopsMainPageSettingsDocument",
  resultKey: "countertopsMainPageSettings",
  templateTypename: "PageSettingsCountertopsMainPage",
  blocksTypenamePrefix: "PageSettingsCountertopsMainPageBlocks",
});

export const FLOORING_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "FlooringMainPageSettingsDocument",
  resultKey: "flooringMainPageSettings",
  templateTypename: "PageSettingsFlooringMainPage",
  blocksTypenamePrefix: "PageSettingsFlooringMainPageBlocks",
});

export const CABINETS_OVERVIEW_PAGE_SETTINGS_QUERY = `
  query CabinetsOverviewPageSettingsDocument($relativePath: String!) {
    cabinetsOverviewPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsCabinetsOverview {
        blocks {
          __typename
          ... on PageSettingsCabinetsOverviewBlocksCabinetCatalogGrid {
            pageTitle
            cardImageSize
            filterImageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsCabinetsOverviewBlocks")}
        }
      }
    }
  }
`;

export const COUNTERTOPS_OVERVIEW_PAGE_SETTINGS_QUERY = `
  query CountertopsOverviewPageSettingsDocument($relativePath: String!) {
    countertopsOverviewPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsCountertopsOverview {
        blocks {
          __typename
          ... on PageSettingsCountertopsOverviewBlocksCountertopCatalogGrid {
            pageTitle
            cardImageSize
            filterImageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsCountertopsOverviewBlocks")}
        }
      }
    }
  }
`;

export const FLOORING_OVERVIEW_PAGE_SETTINGS_QUERY = `
  query FlooringOverviewPageSettingsDocument($relativePath: String!) {
    flooringOverviewPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsFlooringOverview {
        blocks {
          __typename
          ... on PageSettingsFlooringOverviewBlocksFlooringCatalogGrid {
            pageTitle
            cardImageSize
            filterImageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsFlooringOverviewBlocks")}
        }
      }
    }
  }
`;

export const GALLERY_PAGE_SETTINGS_QUERY = `
  query GalleryPageSettingsDocument($relativePath: String!) {
    galleryPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsGallery {
        title
        seo {
          title
          description
          ogImage
        }
        blocks {
          __typename
          ... on PageSettingsGalleryBlocksGalleryProjectGrid {
            pageTitle
            galleryOverviewProjectCardImageSize
            galleryOverviewFilterImageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsGalleryBlocks")}
        }
      }
    }
  }
`;

export const PROJECT_PAGE_SETTINGS_QUERY = `
  query ProjectPageSettingsDocument($relativePath: String!) {
    projectPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsProject {
        blocks {
          __typename
          ... on PageSettingsProjectBlocksProjectInfo {
            breadcrumbLabel
            breadcrumbLink
            galleryImageSize
            lightboxImageSize
          }
          ... on PageSettingsProjectBlocksProjectMaterials {
            title
            cabinetTitle
            cabinetPlaceholder
            countertopTitle
            countertopPlaceholder
            flooringTitle
            flooringPlaceholder
            imageSize
          }
          ... on PageSettingsProjectBlocksProjectRelatedProjects {
            title
            ctaLabel
            ctaLink
            imageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsProjectBlocks")}
        }
      }
    }
  }
`;

export const POST_PAGE_SETTINGS_QUERY = `
  query PostPageSettingsDocument($relativePath: String!) {
    postPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsPost {
        postBreadcrumbLabel
        postRelatedArticlesTitle
        postDetailThumbnailImageSize
        postDetailRelatedArticlesImageSize
      }
    }
  }
`;

export const CABINET_PAGE_SETTINGS_QUERY = `
  query CabinetPageSettingsDocument($relativePath: String!) {
    cabinetPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsCabinet {
        blocks {
          __typename
          ... on PageSettingsCabinetBlocksCabinetProductInfo {
            breadcrumbLabel
            technicalDetailsTitle
            contactButtonLabel
            descriptionLabel
            galleryThumbImageSize
            galleryMainImageSize
            galleryLightboxImageSize
          }
          ... on PageSettingsCabinetBlocksProjectsUsingThisProduct {
            title
            description
            imageSize
          }
          ... on PageSettingsCabinetBlocksRelatedProducts {
            title
            subtitle
            imageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsCabinetBlocks")}
        }
      }
    }
  }
`;

export const COUNTERTOP_PAGE_SETTINGS_QUERY = `
  query CountertopPageSettingsDocument($relativePath: String!) {
    countertopPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsCountertop {
        blocks {
          __typename
          ... on PageSettingsCountertopBlocksCountertopProductInfo {
            breadcrumbLabel
            technicalDetailsTitle
            contactButtonLabel
            descriptionLabel
            galleryThumbImageSize
            galleryMainImageSize
            galleryLightboxImageSize
          }
          ... on PageSettingsCountertopBlocksProjectsUsingThisProduct {
            title
            description
            imageSize
          }
          ... on PageSettingsCountertopBlocksRelatedProducts {
            title
            subtitle
            imageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsCountertopBlocks")}
        }
      }
    }
  }
`;

export const FLOORING_PAGE_SETTINGS_QUERY = `
  query FlooringPageSettingsDocument($relativePath: String!) {
    flooringPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsFlooring {
        blocks {
          __typename
          ... on PageSettingsFlooringBlocksFlooringProductInfo {
            breadcrumbLabel
            technicalDetailsTitle
            contactButtonLabel
            descriptionLabel
            galleryThumbImageSize
            galleryMainImageSize
            galleryLightboxImageSize
          }
          ... on PageSettingsFlooringBlocksProjectsUsingThisProduct {
            title
            description
            imageSize
          }
          ... on PageSettingsFlooringBlocksRelatedProducts {
            title
            subtitle
            imageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsFlooringBlocks")}
        }
      }
    }
  }
`;
