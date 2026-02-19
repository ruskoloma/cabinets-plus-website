"use client";
import { useState } from "react";
import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";

export default function FAQSectionBlock({ block }: { block: any }) {
  const [activeTab, setActiveTab] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const currentTab = block.tabs?.[activeTab];

  return (
    <section className="py-20 bg-white" id="faq">
      <div className="max-w-4xl mx-auto px-6">
        <SectionTitle title={block.title} tinaField={tinaField(block, "title")} centered />

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2 justify-center mt-8 mb-10">
          {block.tabs?.map((tab: any, i: number) => (
            <button
              key={i}
              onClick={() => { setActiveTab(i); setOpenIndex(null); }}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === i
                  ? "bg-amber-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {currentTab?.faqs?.map((faq: any, i: number) => (
            <div
              key={i}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
              >
                <span
                  data-tina-field={tinaField(faq, "question")}
                  className="font-semibold text-slate-800 text-sm pr-4"
                >
                  {faq.question}
                </span>
                <span className={`text-amber-600 text-xl flex-shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-4 bg-slate-50">
                  <span data-tina-field={tinaField(faq, "answer")}>{faq.answer}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
