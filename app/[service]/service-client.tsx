"use client";
import { useTina } from "tinacms/dist/react";
import BlockRenderer from "@/components/blocks/BlockRenderer";

export default function ServicePageClient(props: { data: any; query: string; variables: any }) {
  const { data } = useTina(props);
  return <BlockRenderer blocks={data.service?.blocks} />;
}
