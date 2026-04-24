"use client";

import { tinaField } from "tinacms/dist/react";
import FaqTabsAccordion from "@/components/home/FaqTabsAccordion";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

export default function FAQSectionBlock({ block }: { block: BlockRecord }) {
  const tabs = asBlockArray(block.tabs).map((tab) => ({
    raw: tab,
    label: asText(tab.label),
    faqs: asBlockArray(tab.faqs).map((faq) => ({
      raw: faq,
      question: asText(faq.question),
      answer: asText(faq.answer),
    })),
  }));

  return (
    <section className="bg-[#edebe5] py-8 md:py-16" id="faq">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        <h2
          className="text-center font-[var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]"
          data-tina-field={tinaField(block, "title")}
        >
          {asText(block.title)}
        </h2>
        <FaqTabsAccordion tabs={tabs} />
      </div>
    </section>
  );
}
