export const GALLERY_OVERVIEW_QUERY = `
  query GalleryOverview {
    catalogSettings(relativePath: "catalog-settings.json") {
      id
      _sys {
        filename
        basename
        relativePath
      }
      doorStyles {
        value
        label
        image
      }
      paintOptions {
        value
        label
        image
        swatchColor
      }
      stainTypes {
        value
        label
        image
      }
      rooms
      countertopTypes {
        value
        label
        image
      }
    }
    projectConnection(first: 200) {
      edges {
        node {
          ... on Document {
            id
            _sys {
              filename
              basename
              relativePath
            }
          }
          ... on Project {
            published
            slug
            address
            description
            notes
            sourceUpdatedAt
            media {
              file
              roomPriority
              paintPriority
              stainPriority
              countertopPriority
              flooring
              room
              cabinetPaints
              cabinetStains
              countertop
              label
              description
            }
          }
        }
      }
    }
  }
`;
