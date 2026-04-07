import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import ProjectClient from "./project-client";
import { getLegacyProjectRedirect, getProjectDataSafe, getProjectIndexSafe } from "@/app/get-project-data-safe";
import { getGalleryOverviewDataSafe } from "@/app/get-gallery-overview-data-safe";
import { getProjectPageSettingsSafe } from "@/app/get-project-page-settings-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";
import { getCabinetIndexSafe } from "@/app/get-cabinet-data-safe";
import { getCountertopIndexSafe } from "@/app/get-countertop-data-safe";
import { buildProjectGallery, getProjectHeading } from "@/components/project-detail/helpers";

export async function generateStaticParams() {
  const projectIndex = await getProjectIndexSafe();
  return projectIndex.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const legacyRedirect = getLegacyProjectRedirect(slug);
  if (legacyRedirect) {
    return {
      title: "Project Gallery",
      description: "Browse our recent cabinet, countertop, and remodeling projects.",
    };
  }

  const result = await getProjectDataSafe(slug);
  const project = result.data.project;

  if (!project) return {};

  const defaultImage = buildProjectGallery(project)[0]?.file;

  return {
    title: getProjectHeading(project, slug),
    description: project.description || undefined,
    openGraph: defaultImage ? { images: [{ url: defaultImage }] } : undefined,
  };
}

export default async function ProjectDetailRoute(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const legacyRedirect = getLegacyProjectRedirect(slug);

  if (legacyRedirect) {
    redirect(legacyRedirect);
  }

  const [projectData, overviewData, homePageData, cabinetIndex, countertopIndex, pageSettingsData] = await Promise.all([
    getProjectDataSafe(slug),
    getGalleryOverviewDataSafe(),
    getPageDataSafe("home.md"),
    getCabinetIndexSafe(),
    getCountertopIndexSafe(),
    getProjectPageSettingsSafe(),
  ]);

  if (!projectData.data.project) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <ProjectClient
        cabinetIndex={cabinetIndex}
        currentSlug={slug}
        homePageData={homePageData}
        overviewData={overviewData}
        pageSettingsData={pageSettingsData}
        projectData={projectData}
        countertopIndex={countertopIndex}
      />
    </Suspense>
  );
}
