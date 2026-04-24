"use client";

import { tinaField } from "tinacms/dist/react";
import ContactUsSection from "@/components/shared/ContactUsSection";
import { resolveTemplateName, type HomeBlock } from "@/app/figma-home.helpers";
import SharedPageSectionRenderer from "@/components/shared/SharedPageSectionRenderer";
import { useResolvedSharedSectionBlocks, useSharedSectionBlock } from "@/components/shared/use-shared-sections";
import { buildProjectGallery, getProjectSlug } from "./helpers";
import ProjectInfoSection from "./ProjectInfoSection";
import ProjectMaterialsSection from "./ProjectMaterialsSection";
import ProjectRelatedProjectsSection from "./ProjectRelatedProjectsSection";
import type { ProjectDetailPageProps } from "./types";

const PROJECT_INFO_TEMPLATE = "projectInfo";

function ensureProjectInfoBlock(blocks: HomeBlock[]): HomeBlock[] {
  const hasProjectInfo = blocks.some(
    (block) => resolveTemplateName(block) === PROJECT_INFO_TEMPLATE,
  );
  if (hasProjectInfo) return blocks;
  return [{ _template: PROJECT_INFO_TEMPLATE } as HomeBlock, ...blocks];
}

export default function ProjectDetailPage({
  project,
  pageSettingsRecord,
  cabinetIndex,
  countertopIndex,
  flooringIndex,
  overviewData,
  contactBlock,
}: ProjectDetailPageProps) {
  const rawBlocks = useResolvedSharedSectionBlocks(
    pageSettingsRecord && typeof pageSettingsRecord === "object"
      ? (pageSettingsRecord as { blocks?: unknown }).blocks
      : null,
  );
  const blocks = ensureProjectInfoBlock(rawBlocks as HomeBlock[]);
  const sharedContactBlock = useSharedSectionBlock("contactSection");
  const fallbackContactBlock = contactBlock || sharedContactBlock;

  const galleryItems = buildProjectGallery(project);
  const currentSlug = getProjectSlug(project, "project");

  return (
    <div className="bg-white">
      {blocks.map((block, index) => {
        const template = resolveTemplateName(block);
        const blockRecord = block as Record<string, unknown>;
        const blockField = tinaField(blockRecord) || undefined;
        const key = `${template || "block"}-${index}`;

        switch (template) {
          case "projectInfo":
            // No outer data-tina-field wrapper: clicking a media tile must focus the PROJECT
            // document's media list item, not the page-settings block. Block-level settings
            // (breadcrumb label, image sizes) stay reachable through inner data-tina-fields.
            return (
              <ProjectInfoSection block={blockRecord} galleryItems={galleryItems} key={key} project={project} />
            );

          case "projectMaterials":
            // No outer data-tina-field wrapper here: clicking a material card must NOT bubble
            // up and cause Tina to focus on the page-settings block. Block-level editing is
            // still reachable through the section title's data-tina-field inside the component.
            return (
              <ProjectMaterialsSection
                block={blockRecord}
                cabinetIndex={cabinetIndex}
                countertopIndex={countertopIndex}
                flooringIndex={flooringIndex}
                key={key}
                project={project}
              />
            );

          case "projectRelatedProjects":
            // No outer data-tina-field wrapper: clicking a related-project card must focus the
            // current project's relatedProjects list row, not the block's page-settings object.
            return (
              <ProjectRelatedProjectsSection
                block={blockRecord}
                key={key}
                overviewData={overviewData}
                project={project}
              />
            );

          default:
            return (
              <SharedPageSectionRenderer block={blockRecord} key={key} template={template} />
            );
        }
      })}

      {fallbackContactBlock && !blocks.some((block) => resolveTemplateName(block) === "contactSection") ? (
        <ContactUsSection block={fallbackContactBlock} />
      ) : null}

      <div className="sr-only" data-current-project={currentSlug} />
    </div>
  );
}
