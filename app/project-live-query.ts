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
        primaryPicture
        relatedProjects {
          __typename
          project {
            ... on Project {
              id
              title
              slug
              primaryPicture
              _sys {
                filename
                basename
                relativePath
              }
            }
          }
        }
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
      }
    }
  }
`;
