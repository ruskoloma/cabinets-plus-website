import { tinaField } from "tinacms/dist/react";
import Link from "next/link";
import SectionTitle from "@/components/ui/SectionTitle";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

const GRADIENTS = [
  "from-amber-700 to-amber-500",
  "from-slate-700 to-slate-500",
  "from-stone-700 to-stone-500",
];

export default function ProductsSectionBlock({ block }: { block: BlockRecord }) {
  const products = asBlockArray(block.products);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle title={asText(block.title)} tinaField={tinaField(block, "title")} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          {products.map((product, i) => (
            <Link
              key={i}
              href={asText(product.link, "#")}
              className="group block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              {asText(product.image) ? (
                <img
                  src={asText(product.image)}
                  alt={asText(product.name, "Product")}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className={`h-64 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
                  <span className="text-5xl">🏠</span>
                </div>
              )}
              <div className="bg-white p-5 flex items-center justify-between">
                <span
                  data-tina-field={tinaField(product, "name")}
                  className="text-lg font-bold text-slate-800"
                >
                  {asText(product.name)}
                </span>
                <span className="text-amber-600 text-xl">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
