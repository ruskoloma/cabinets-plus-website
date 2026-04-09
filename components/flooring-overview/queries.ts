export const FLOORING_OVERVIEW_QUERY = `
  query FlooringOverview {
    catalogSettings(relativePath: "catalog-settings.json") {
      ... on Document {
        _sys {
          filename
          basename
          relativePath
        }
        id
      }
      ... on CatalogSettings {
        __typename
        id
        doorStyles {
          __typename
          value
          label
          image
        }
        paintOptions {
          __typename
          value
          label
          swatchColor
          image
        }
        stainTypes {
          __typename
          value
          label
          image
        }
        rooms
        flooringTypes {
          __typename
          value
          label
          image
        }
        _values
      }
    }

    flooringConnection(first: 500) {
      edges {
        node {
          __typename
          _sys {
            filename
            basename
            relativePath
          }
          id
          published
          name
          code
          slug
          flooringType
          description
          picture
          sourceUpdatedAt
          _values
        }
      }
    }
  }
`;
