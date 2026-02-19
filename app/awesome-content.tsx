"use client";
import { useTina, tinaField } from "tinacms/dist/react";

export default function AwesomeContent({data}: any) {
  const pageData = useTina({
    data: data.data,
    query: data.query,
    variables: data.variables,
  });

  const doc = pageData.data.my_first_collection;

  return (
    <>
      <h1 data-tina-field={tinaField(doc, "title")}>{doc.title}</h1>
    </>
  );
}