import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";
import FillImage from "@/components/ui/FillImage";
import { resolveConfiguredImageVariant } from "@/lib/image-size-controls";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

const SERVICE_GRADIENTS = [
  "from-blue-900 to-blue-700",
  "from-emerald-900 to-emerald-700",
];

export default function ServicesSectionBlock({ block }: { block: BlockRecord }) {
  const services = asBlockArray(block.services);
  const imageVariant = resolveConfiguredImageVariant(block.imageSize, "feature");

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle title={asText(block.title)} tinaField={tinaField(block, "title")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {services.map((service, i) => (
            <div
              key={i}
              className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100"
            >
              {asText(service.image) ? (
                <div className="relative h-56">
                  <FillImage alt={asText(service.title, "Service")} className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" src={asText(service.image)} variant={imageVariant} />
                </div>
              ) : (
                <div className={`h-56 bg-gradient-to-br ${SERVICE_GRADIENTS[i % SERVICE_GRADIENTS.length]} flex items-center justify-center`}>
                  <span className="text-6xl">{i === 0 ? "🛁" : "🍳"}</span>
                </div>
              )}
              <div className="p-7">
                <h3
                  data-tina-field={tinaField(service, "title")}
                  className="text-xl font-bold text-slate-800 mb-3"
                >
                  {asText(service.title)}
                </h3>
                <p
                  data-tina-field={tinaField(service, "description")}
                  className="text-slate-500 leading-relaxed mb-5"
                >
                  {asText(service.description)}
                </p>
                <Button href={asText(service.link, "#")} variant="outline">
                  Learn More →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
