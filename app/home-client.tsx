"use client";
import { useTina } from "tinacms/dist/react";
import FigmaHome from "./figma-home";

interface Props {
  data: Record<string, unknown>;
  query?: string;
  variables?: Record<string, unknown>;
}

function TinaHomeClient(props: Props) {
  const { data } = useTina({
    data: props.data,
    query: props.query || "",
    variables: props.variables || {},
  });

  const page = (data as { page?: Record<string, unknown> }).page;

  return <FigmaHome page={page || {}} />;
}

export default function HomeClient(props: Props) {
  const hasLiveQuery = Boolean(props.query && props.query.trim().length > 0);

  if (!hasLiveQuery) {
    const page = (props.data as { page?: Record<string, unknown> }).page;
    return <FigmaHome page={page || {}} />;
  }

  return <TinaHomeClient {...props} />;
}
