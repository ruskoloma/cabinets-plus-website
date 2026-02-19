import { tinaField } from "tinacms/dist/react";
import Link from "next/link";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";

const SERVICE_GRADIENTS = [
  "from-blue-900 to-blue-700",
  "from-emerald-900 to-emerald-700",
];

export default function ServicesSectionBlock({ block }: { block: any }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle title={block.title} tinaField={tinaField(block, "title")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {block.services?.map((service: any, i: number) => (
            <div
              key={i}
              className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100"
            >
              {service.image ? (
                <img src={service.image} alt={service.title} className="w-full h-56 object-cover" />
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
                  {service.title}
                </h3>
                <p
                  data-tina-field={tinaField(service, "description")}
                  className="text-slate-500 leading-relaxed mb-5"
                >
                  {service.description}
                </p>
                <Button href={service.link || "#"} variant="outline">
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
