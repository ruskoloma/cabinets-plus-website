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
        relatedProjects
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
