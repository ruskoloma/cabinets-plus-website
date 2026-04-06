export const COUNTERTOP_LIVE_QUERY = `
  query CountertopLive($relativePath: String!) {
    countertop(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on Countertop {
        __typename
        published
        name
        code
        slug
        countertopType
        description
        picture
        relatedProjects {
          __typename
          project {
            ... on Project {
              title
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
          kind
          mimeType
          isPrimary
          label
          altText
          description
          sourceId
        }
        sourceId
        sourceUpdatedAt
        _values
      }
    }
  }
`;
