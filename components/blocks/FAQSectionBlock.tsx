"use client";

import { tinaField } from "tinacms/dist/react";
import FaqTabsAccordion from "@/components/home/FaqTabsAccordion";
import { asBlockArray, asText, type BlockRecord } from "./block-types";

export default function FAQSectionBlock({ block }: { block: BlockRecord }) {
  const record = block as Record<string, unknown>;
  const tabs = asBlockArray(block.tabs)
    .map((tab) => ({
      raw: tab as Record<string, unknown>,
      label: asText(tab.label),
      faqs: asBlockArray(tab.faqs)
        .map((faq) => ({
          raw: faq as Record<string, unknown>,
          question: asText(faq.question),
          answer: asText(faq.answer),
        }))
        .filter((faq) => faq.question.length > 0),
    }))
    .filter((tab) => tab.label.length > 0);

  return (
    <section className="bg-[#edebe5] py-8 md:py-16" data-tina-field={tinaField(record)} id="faq">
      <div className="cp-container px-4 md:px-8">
        <h2
          className="text-center text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
          data-tina-field={tinaField(record, "title")}
        >
          {asText(block.title, "F.A.Q.")}
        </h2>
        <FaqTabsAccordion tabs={tabs} />
      </div>
    </section>
  );
}
