export const BLOG_POSTS_QUERY = `
  query BlogPosts {
    postConnection(first: 200, sort: "date") {
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
          ... on Post {
            title
            date
            thumbnail
            subtitle
            hideInFeed
          }
        }
      }
    }
  }
`;
