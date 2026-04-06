"use client";

import { useEditState, useTina, tinaField } from "tinacms/dist/react";
import { GALLERY_OVERVIEW_QUERY } from "@/components/gallery-overview/queries";
import type { GalleryOverviewQueryLikeResult } from "@/components/gallery-overview/types";
import { normalizeGalleryOverviewQueryData } from "@/components/gallery-overview/normalize-gallery-overview-query";
import { PROJECT_PAGE_SETTINGS_QUERY } from "@/components/page-settings/queries";
import type { ProjectPageSettingsQueryLikeResult } from "@/components/page-settings/types";
import ProjectDetailPage from "@/components/project-detail/ProjectDetailPage";
import { normalizeProjectQueryData } from "@/components/project-detail/normalize-project-query";
import {
  buildMaterialCards,
  buildProjectGallery,
  buildRelatedProjectCards,
} from "@/components/project-detail/helpers";
import type {
  CabinetListItem,
  CountertopListItem,
  ProjectDetailQueryLikeResult,
} from "@/components/project-detail/types";
import { PROJECT_LIVE_QUERY } from "@/app/project-live-query";

interface HomePageDataShape {
  page?: {
    blocks?: unknown[] | null;
  } | null;
}

interface HomePageQueryLikeResult {
  data: HomePageDataShape;
  query?: string;
  variables?: Record<string, unknown>;
}

interface ProjectDetailClientProps {
  currentSlug: string;
  cabinetIndex: CabinetListItem[];
  countertopIndex: CountertopListItem[];
  projectData: ProjectDetailQueryLikeResult;
  overviewData: GalleryOverviewQueryLikeResult;
  homePageData: HomePageQueryLikeResult;
  pageSettingsData: ProjectPageSettingsQueryLikeResult;
}

function extractContactBlock(pageData: unknown): Record<string, unknown> | null {
  if (!pageData || typeof pageData !== "object") return null;

  const page = pageData as { page?: { blocks?: unknown[] | null } | null };
  const blocks = Array.isArray(page.page?.blocks) ? page.page.blocks : [];

  const found = blocks.find((block) => {
    if (!block || typeof block !== "object") return false;
    const typed = block as { __typename?: string; _template?: string };
    return typed.__typename === "PageBlocksContactSection" || typed._template === "contactSection";
  });

  return found && typeof found === "object" ? (found as Record<string, unknown>) : null;
}

function ProjectDetailRenderer({
  cabinetIndex,
  countertopIndex,
  projectData,
  overviewData,
  homePageData,
  pageSettingsData,
}: ProjectDetailClientProps) {
  const project = projectData.data.project;
  if (!project) return null;

  const normalizedOverview = normalizeGalleryOverviewQueryData(overviewData.data);
  const contactBlock = extractContactBlock(homePageData.data);
  const galleryItems = buildProjectGallery(project);
  const materialCards = buildMaterialCards(project, cabinetIndex, countertopIndex, tinaField);
  const relatedProjects = buildRelatedProjectCards(project, normalizedOverview, tinaField);
  const pageSettings = pageSettingsData.data.projectPageSettings || null;

  return (
    <ProjectDetailPage
      contactBlock={contactBlock}
      galleryItems={galleryItems}
      galleryImageSizeChoice={pageSettings?.projectDetailGalleryImageSize}
      lightboxImageSizeChoice={pageSettings?.projectDetailLightboxImageSize}
      materialCardImageSizeChoice={pageSettings?.projectDetailMaterialCardImageSize}
      materialCards={materialCards}
      materialsTitle={pageSettings?.projectDetailMaterialsTitle}
      pageSettingsRecord={pageSettings && typeof pageSettings === "object" ? (pageSettings as Record<string, unknown>) : null}
      project={project}
      relatedProjectsCtaLabel={pageSettings?.projectDetailRelatedProjectsCtaLabel}
      relatedProjects={relatedProjects}
      relatedProjectsImageSizeChoice={pageSettings?.projectDetailRelatedProjectsImageSize}
      relatedProjectsTitle={pageSettings?.projectDetailRelatedProjectsTitle}
    />
  );
}

function TinaProjectDetailClient(props: ProjectDetailClientProps) {
  const projectQuery = props.projectData.query?.trim() || PROJECT_LIVE_QUERY;
  const projectVariables = props.projectData.query?.trim()
    ? (props.projectData.variables || {})
    : { relativePath: `${props.currentSlug}.md` };
  const overviewQuery = props.overviewData.query?.trim() || GALLERY_OVERVIEW_QUERY;
  const homeQuery = props.homePageData.query?.trim() || "";
  const pageSettingsQuery = props.pageSettingsData.query?.trim() || PROJECT_PAGE_SETTINGS_QUERY;

  const { data: projectData } = useTina({
    data: props.projectData.data,
    query: projectQuery,
    variables: projectVariables,
  });

  const { data: overviewData } = useTina({
    data: props.overviewData.data,
    query: overviewQuery,
    variables: props.overviewData.variables || {},
  });

  const { data: homePageData } = useTina({
    data: props.homePageData.data,
    query: homeQuery,
    variables: props.homePageData.variables || {},
  });
  const { data: pageSettingsData } = useTina({
    data: props.pageSettingsData.data,
    query: pageSettingsQuery,
    variables: props.pageSettingsData.variables || {},
  });

  return (
    <ProjectDetailRenderer
      cabinetIndex={props.cabinetIndex}
      currentSlug={props.currentSlug}
      countertopIndex={props.countertopIndex}
      homePageData={{
        ...props.homePageData,
        data: homeQuery ? homePageData : props.homePageData.data,
      }}
      pageSettingsData={{
        ...props.pageSettingsData,
        data: pageSettingsQuery ? pageSettingsData : props.pageSettingsData.data,
      }}
      overviewData={{
        ...props.overviewData,
        data: normalizeGalleryOverviewQueryData(overviewData),
      }}
      projectData={{
        ...props.projectData,
        data: normalizeProjectQueryData(projectData, `${props.currentSlug}.md`),
      }}
    />
  );
}

export default function ProjectClient(props: ProjectDetailClientProps) {
  const { edit } = useEditState();
  const hasLiveProjectQuery = Boolean(props.projectData.query && props.projectData.query.trim().length > 0);

  if (!hasLiveProjectQuery && !edit) {
    return <ProjectDetailRenderer {...props} />;
  }

  return <TinaProjectDetailClient {...props} />;
}
