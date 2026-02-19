"use client";
import { useTina } from "tinacms/dist/react";
import BlockRenderer from "@/components/blocks/BlockRenderer";

interface Props {
  data: any;
  query: string;
  variables: any;
}

export default function HomeClient(props: Props) {
  const { data } = useTina({
    data: props.data,
    query: props.query,
    variables: props.variables,
  });

  return <BlockRenderer blocks={data.page?.blocks} />;
}
