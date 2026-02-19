import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";

export default function RichContentBlock({ block }: { block: any }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        {block.title && (
          <h1
            data-tina-field={tinaField(block, "title")}
            className="text-4xl font-bold text-slate-800 mb-8"
          >
            {block.title}
          </h1>
        )}
        <div
          data-tina-field={tinaField(block, "body")}
          className="prose prose-slate max-w-none"
        >
          <TinaMarkdown content={block.body} />
        </div>
      </div>
    </section>
  );
}
