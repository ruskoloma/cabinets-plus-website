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
        pageTitle
        cabinetsOverviewCardImageSize
        cabinetsOverviewFilterImageSize
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
        pageTitle
        countertopsOverviewCardImageSize
        countertopsOverviewFilterImageSize
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
        pageTitle
        flooringOverviewCardImageSize
        flooringOverviewFilterImageSize
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
        pageTitle
        galleryOverviewProjectCardImageSize
        galleryOverviewFilterImageSize
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
        projectDetailMaterialsTitle
        projectDetailRelatedProjectsTitle
        projectDetailRelatedProjectsCtaLabel
        projectDetailMaterialCardImageSize
        projectDetailGalleryImageSize
        projectDetailLightboxImageSize
        projectDetailRelatedProjectsImageSize
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
          ... on PageSettingsCabinetBlocksTextImageSection {
            title
            paragraphs
            image
            imagePosition
            ctaLabel
            ctaLink
          }
          ... on PageSettingsCabinetBlocksFaqSection {
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
          ... on PageSettingsCabinetBlocksShowroomBanner {
            heading
            subtext
            ctaLabel
            ctaLink
            image
            imageSize
          }
          ... on PageSettingsCabinetBlocksPartnersSection {
            title
            description
            footnote
            partnerLogos {
              logo
              alt
              url
            }
          }
          ... on PageSettingsCabinetBlocksContactSection {
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
            showroomTitle
            followUsLabel
            mapEmbedUrl
          }
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
          ... on PageSettingsCountertopBlocksTextImageSection {
            title
            paragraphs
            image
            imagePosition
            ctaLabel
            ctaLink
          }
          ... on PageSettingsCountertopBlocksFaqSection {
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
          ... on PageSettingsCountertopBlocksShowroomBanner {
            heading
            subtext
            ctaLabel
            ctaLink
            image
            imageSize
          }
          ... on PageSettingsCountertopBlocksPartnersSection {
            title
            description
            footnote
            partnerLogos {
              logo
              alt
              url
            }
          }
          ... on PageSettingsCountertopBlocksContactSection {
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
            showroomTitle
            followUsLabel
            mapEmbedUrl
          }
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
          ... on PageSettingsFlooringBlocksTextImageSection {
            title
            paragraphs
            image
            imagePosition
            ctaLabel
            ctaLink
          }
          ... on PageSettingsFlooringBlocksFaqSection {
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
          ... on PageSettingsFlooringBlocksShowroomBanner {
            heading
            subtext
            ctaLabel
            ctaLink
            image
            imageSize
          }
          ... on PageSettingsFlooringBlocksPartnersSection {
            title
            description
            footnote
            partnerLogos {
              logo
              alt
              url
            }
          }
          ... on PageSettingsFlooringBlocksContactSection {
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
            showroomTitle
            followUsLabel
            mapEmbedUrl
          }
        }
      }
    }
  }
`;
