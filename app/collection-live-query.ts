export const COLLECTION_LIVE_QUERY = `
  query CollectionDetail($relativePath: String!) {
    specialityCollection(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on SpecialityCollection {
        __typename
        published
        title
        slug
        description
        coverImage
        sourceUpdatedAt
        media {
          __typename
          file
          label
          description
        }
        relatedProjects {
          __typename
          project {
            ... on Project {
              id
              title
              slug
              media {
                file
              }
              _sys {
                filename
                basename
                relativePath
              }
            }
          }
        }
        _values
      }
    }
  }
`;
