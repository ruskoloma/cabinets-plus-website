import { tinaField } from "tinacms/dist/react";
import { asText, type BlockRecord } from "./block-types";

const DEFAULT_HEIGHT = "85vh";

export default function MagazineEmbedSection({ block }: { block: BlockRecord }) {
  const heading = asText(block.heading);
  const subheading = asText(block.subheading);
  const embedUrl = asText(block.embedUrl);
  const heightRaw = asText(block.height).trim();
  const height = heightRaw.length > 0 ? heightRaw : DEFAULT_HEIGHT;
  const iframeTitle = asText(block.iframeTitle, heading || "Magazine");

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1440px] px-6">
        {(heading || subheading) && (
          <div className="text-center mb-8">
            {heading && (
              <h1
                data-tina-field={tinaField(block, "heading")}
                className="text-3xl md:text-5xl font-bold text-[var(--cp-primary-500)] mb-4"
              >
                {heading}
              </h1>
            )}
            {subheading && (
              <p
                data-tina-field={tinaField(block, "subheading")}
                className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto"
              >
                {subheading}
              </p>
            )}
          </div>
        )}
        {embedUrl ? (
          <div
            data-tina-field={tinaField(block, "embedUrl")}
            className="w-full overflow-hidden rounded-lg shadow-lg bg-slate-100"
            style={{ height }}
          >
            <iframe
              src={embedUrl}
              title={iframeTitle}
              width="100%"
              height="100%"
              style={{ border: "none", display: "block" }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : (
          <div
            data-tina-field={tinaField(block, "embedUrl")}
            className="w-full flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500"
            style={{ height }}
          >
            Add a magazine embed URL in Page Settings.
          </div>
        )}
      </div>
    </section>
  );
}
