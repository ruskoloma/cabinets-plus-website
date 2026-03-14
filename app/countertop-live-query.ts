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
        name
        code
        slug
        countertopType
        inStock
        storeCollection
        description
        picture
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
