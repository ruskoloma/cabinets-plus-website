"use client";

import { useState } from "react";
import { tinaField } from "tinacms/dist/react";

interface FaqItem {
  raw?: Record<string, unknown>;
  question: string;
  answer: string;
}

interface MiniFaqAccordionProps {
  faqs: FaqItem[];
}

export default function MiniFaqAccordion({ faqs }: MiniFaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  return (
    <div className="mx-auto mt-6 w-full border-t border-[var(--cp-primary-100)] md:mt-10">
      {faqs.map((faq, index) => (
        <article className="border-b border-[var(--cp-primary-100)]" data-tina-field={faq.raw ? tinaField(faq.raw) : undefined} key={`${faq.question}-${index}`}>
          <button
            className="flex w-full items-start justify-between gap-8 py-4 text-left md:px-6"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            type="button"
          >
            <span
              className="cp-faq-question pr-4 font-[var(--font-red-hat-display)] text-[16px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:text-[20px] md:font-bold"
              data-tina-field={faq.raw ? tinaField(faq.raw, "question") : undefined}
            >
              {faq.question}
            </span>
            <span aria-hidden className="pt-1 text-[28px] leading-none text-[var(--cp-primary-500)]">
              {openIndex === index ? "−" : "+"}
            </span>
          </button>
          {openIndex === index ? (
            <p
              className="max-w-[941px] pb-4 text-[16px] leading-[1.5] text-[var(--cp-primary-500)]/90 md:px-6 md:text-[18px]"
              data-tina-field={faq.raw ? tinaField(faq.raw, "answer") : undefined}
            >
              {faq.answer}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
