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
        breadcrumbLabel
        technicalDetailsTitle
        contactButtonLabel
        descriptionLabel
        galleryThumbImageSize
        galleryMainImageSize
        galleryLightboxImageSize
        relatedProductsTitle
        relatedProductsImageSize
        projectsSectionTitle
        projectsSectionDescription
        projectsSectionImageSize
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
        breadcrumbLabel
        technicalDetailsTitle
        contactButtonLabel
        descriptionLabel
        galleryThumbImageSize
        galleryMainImageSize
        galleryLightboxImageSize
        relatedProductsTitle
        relatedProductsImageSize
        projectsSectionTitle
        projectsSectionDescription
        projectsSectionImageSize
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
        breadcrumbLabel
        technicalDetailsTitle
        contactButtonLabel
        descriptionLabel
        galleryThumbImageSize
        galleryMainImageSize
        galleryLightboxImageSize
        relatedProductsTitle
        relatedProductsImageSize
        projectsSectionTitle
        projectsSectionDescription
        projectsSectionImageSize
      }
    }
  }
`;
