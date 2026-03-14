import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import ProjectClient from "./project-client";
import { getLegacyProjectRedirect, getProjectDataSafe, getProjectIndexSafe } from "@/app/get-project-data-safe";
import { getGalleryOverviewDataSafe } from "@/app/get-gallery-overview-data-safe";
import { getPageDataSafe } from "@/app/get-page-data-safe";
import { getCabinetIndexSafe } from "@/app/get-cabinet-data-safe";

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

  return {
    title: project.title || slug,
    description: project.description || undefined,
    openGraph: project.primaryPicture ? { images: [{ url: project.primaryPicture }] } : undefined,
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

  const [projectData, overviewData, homePageData, cabinetIndex] = await Promise.all([
    getProjectDataSafe(slug),
    getGalleryOverviewDataSafe(),
    getPageDataSafe("home.md"),
    getCabinetIndexSafe(),
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
        projectData={projectData}
      />
    </Suspense>
  );
}
