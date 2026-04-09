export const FLOORING_LIVE_QUERY = `
  query FlooringLive($relativePath: String!) {
    flooring(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on Flooring {
        __typename
        published
        name
        code
        slug
        flooringType
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
          product {
            ... on Flooring {
              __typename
              id
              name
              code
              slug
              flooringType
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
