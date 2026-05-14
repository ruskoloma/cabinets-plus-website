export const PROJECT_LIVE_QUERY = `
  query ProjectDetail($relativePath: String!) {
    project(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on Project {
        __typename
        title
        slug
        address
        description
        notes
        cabinetProducts {
          __typename
          cabinet {
            ... on Cabinet {
              id
              name
              code
              slug
              picture
              _sys {
                filename
                basename
                relativePath
              }
            }
          }
          customName
          subtitle
          type
        }
        countertopProducts {
          __typename
          countertop {
            ... on Countertop {
              id
              name
              code
              slug
              picture
              _sys {
                filename
                basename
                relativePath
              }
            }
          }
          customName
          subtitle
          type
        }
        flooringProducts {
          __typename
          flooring {
            ... on Flooring {
              id
              name
              code
              slug
              picture
              _sys {
                filename
                basename
                relativePath
              }
            }
          }
          customName
          subtitle
          type
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
          doorStyles
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
