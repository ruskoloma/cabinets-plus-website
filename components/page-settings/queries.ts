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

export const KITCHEN_REMODEL_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "KitchenRemodelMainPageSettingsDocument",
  resultKey: "kitchenRemodelMainPageSettings",
  templateTypename: "PageSettingsKitchenRemodelMainPage",
  blocksTypenamePrefix: "PageSettingsKitchenRemodelMainPageBlocks",
});

export const BATHROOM_REMODEL_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "BathroomRemodelMainPageSettingsDocument",
  resultKey: "bathroomRemodelMainPageSettings",
  templateTypename: "PageSettingsBathroomRemodelMainPage",
  blocksTypenamePrefix: "PageSettingsBathroomRemodelMainPageBlocks",
});

export const GLASS_ENCLOSURES_MAIN_PAGE_SETTINGS_QUERY = buildServiceMainPageSettingsQuery({
  operationName: "GlassEnclosuresMainPageSettingsDocument",
  resultKey: "glassEnclosuresMainPageSettings",
  templateTypename: "PageSettingsGlassEnclosuresMainPage",
  blocksTypenamePrefix: "PageSettingsGlassEnclosuresMainPageBlocks",
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
            specialityTitle
            specialityEnabled
            specialityCardImageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsGalleryBlocks")}
        }
      }
    }
  }
`;

export const BLOG_PAGE_SETTINGS_QUERY = `
  query BlogPageSettingsDocument($relativePath: String!) {
    blogPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsBlog {
        title
        seo {
          title
          description
          ogImage
        }
        blocks {
          __typename
          ... on PageSettingsBlogBlocksBlogPostsGrid {
            pageTitle
            postsPerPage
            postCardImageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsBlogBlocks")}
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

export const COLLECTION_PAGE_SETTINGS_QUERY = `
  query CollectionPageSettingsDocument($relativePath: String!) {
    collectionPageSettings: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsCollection {
        blocks {
          __typename
          ... on PageSettingsCollectionBlocksCollectionInfo {
            breadcrumbLabel
            breadcrumbLink
            galleryImageSize
            lightboxImageSize
          }
          ... on PageSettingsCollectionBlocksCollectionRelatedProjects {
            title
            ctaLabel
            ctaLink
            imageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsCollectionBlocks")}
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
        title
        seo {
          title
          description
          ogImage
        }
        blocks {
          __typename
          ... on PageSettingsPostBlocksPostContent {
            breadcrumbLabel
            heroImageSize
          }
          ... on PageSettingsPostBlocksPostRelatedArticles {
            title
            imageSize
          }
${buildSharedPageSettingsBlockFragments("PageSettingsPostBlocks")}
        }
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
