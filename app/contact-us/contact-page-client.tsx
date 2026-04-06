"use client";

import { useTina } from "tinacms/dist/react";
import OurShowroomSection from "@/components/home/OurShowroomSection";
import ContactUsSection from "@/components/home/ContactUsSection";
import { getBlock, toBlockArray, type Dict } from "@/app/figma-home.helpers";

interface ContactPageClientProps {
  data: { page?: { blocks?: unknown[] | null } | null };
  query?: string;
  variables?: Record<string, unknown>;
}

function renderSections(block: Dict) {
  return (
    <>
      <OurShowroomSection block={block} />
      <ContactUsSection block={block} />
    </>
  );
}

function TinaContactPageClient(props: ContactPageClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  const block = getBlock(toBlockArray(data.page?.blocks), "contactSection");
  return renderSections(block);
}

export default function ContactPageClient(props: ContactPageClientProps) {
  const block = getBlock(toBlockArray(props.data?.page?.blocks), "contactSection");
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    return renderSections(block);
  }

  return <TinaContactPageClient {...props} />;
}
