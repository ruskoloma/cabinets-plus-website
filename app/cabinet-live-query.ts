export const CABINET_LIVE_QUERY = `
  query CabinetDoorLive($relativePath: String!) {
    cabinet(relativePath: $relativePath) {
      ... on Document {
        _sys {
          filename
          basename
          relativePath
        }
        id
      }
      ... on Cabinet {
        __typename
        name
        code
        slug
        doorStyle
        paint
        stainType
        description
        picture
        relatedProjects
        relatedProducts {
          __typename
          product
        }
        technicalDetails {
          __typename
          key
          value
          unit
          order
        }
        media {
          __typename
          file
          roomPriority
          paintPriority
          stainPriority
          countertopPriority
          room
          paint
          stain
          countertop
          label
          description
        }
        sourceId
        sourceUpdatedAt
        _values
      }
    }
  }
`;
