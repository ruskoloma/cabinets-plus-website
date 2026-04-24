import type { ComponentProps } from "react";
import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import { asText, type BlockRecord } from "./block-types";

type RichTextContent = ComponentProps<typeof TinaMarkdown>["content"];

export default function RichContentBlock({ block }: { block: BlockRecord }) {
  const title = asText(block.title);
  const body = block.body as RichTextContent;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        {title && (
          <h1
            data-tina-field={tinaField(block, "title")}
            className="text-4xl font-bold text-slate-800 mb-8"
          >
            {title}
          </h1>
        )}
        <div
          data-tina-field={tinaField(block, "body")}
          className="prose prose-slate max-w-none"
        >
          <TinaMarkdown content={body} />
        </div>
      </div>
    </section>
  );
}
