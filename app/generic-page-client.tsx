"use client";
import { useTina } from "tinacms/dist/react";
import BlockRenderer from "@/components/blocks/BlockRenderer";

// Shared client component for any page collection document (about-us, contact-us, etc.)
export default function GenericPageClient(props: { data: any; query: string; variables: any }) {
  const { data } = useTina(props);
  return <BlockRenderer blocks={data.page?.blocks} />;
}
