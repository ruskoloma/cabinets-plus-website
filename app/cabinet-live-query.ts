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
        published
        name
        code
        slug
        doorStyle
        paint
        stainType
        description
        picture
        relatedProjects {
          __typename
          project {
            ... on Project {
              slug
              _sys {
                filename
                relativePath
              }
            }
          }
        }
        relatedProducts {
          __typename
          product {
            ... on Cabinet {
              __typename
              id
              name
              code
              slug
              doorStyle
              paint
              stainType
              description
              picture
              _sys {
                filename
                basename
                relativePath
              }
            }
          }
        }
        technicalDetails {
          __typename
          key
          value
        }
        media {
          __typename
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
        sourceId
        sourceUpdatedAt
        _values
      }
    }
  }
`;
