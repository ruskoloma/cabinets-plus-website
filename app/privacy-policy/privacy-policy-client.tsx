"use client";

import { tinaField, useTina } from "tinacms/dist/react";
import ArticleBodySection from "@/components/post/ArticleBodySection";
import PostPageHero from "@/components/post/PostPageHero";
import type { PageQuery, PageQueryVariables } from "@/tina/__generated__/types";

interface PrivacyPolicyClientProps {
  data: PageQuery;
  query: string;
  variables: PageQueryVariables;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export default function PrivacyPolicyClient(props: PrivacyPolicyClientProps) {
  const { data } = useTina({
    data: props.data,
    query: props.query,
    variables: props.variables,
  });

  const page = data.page;
  if (!page) return null;

  const pageRecord = page as unknown as Record<string, unknown>;
  const title = text(page.title, "Privacy Policy");
  const subtitle = text(page.seo?.description);
  const body = (pageRecord.body ?? null) as React.ComponentProps<typeof ArticleBodySection>["content"];

  return (
    <article className="bg-white text-[var(--cp-primary-500)]">
      <PostPageHero
        breadcrumbItems={[
          { label: "Legal" },
          { label: title, tinaFieldValue: tinaField(pageRecord, "title") || undefined },
        ]}
        rootTinaFieldValue={tinaField(pageRecord) || undefined}
        subtitle={subtitle}
        subtitleTinaFieldValue={tinaField(pageRecord, "seo") || undefined}
        title={title}
        titleTinaFieldValue={tinaField(pageRecord, "title") || undefined}
      />

      <ArticleBodySection
        content={body}
        innerTinaFieldValue={tinaField(pageRecord, "body") || undefined}
        rootTinaFieldValue={tinaField(pageRecord, "body") || undefined}
      />
    </article>
  );
}
