"use client";

import { useState } from "react";
import { tinaField } from "tinacms/dist/react";

interface FaqItem {
  raw?: Record<string, unknown>;
  question: string;
  answer: string;
}

interface FaqTab {
  raw?: Record<string, unknown>;
  label: string;
  faqs: FaqItem[];
}

interface FaqTabsAccordionProps {
  tabs: FaqTab[];
}

export default function FaqTabsAccordion({ tabs }: FaqTabsAccordionProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const currentTab = tabs[Math.min(activeTab, Math.max(0, tabs.length - 1))];
  if (!currentTab) return null;

  return (
    <>
      <div className="mt-6 overflow-x-auto md:mt-10">
        <div className="mx-auto flex min-w-max gap-6 px-4 md:justify-center md:gap-8 md:px-0">
          {tabs.map((tab, index) => (
            <button
              className={`border-b-2 pb-[2px] whitespace-nowrap font-[var(--font-red-hat-display)] text-[16px] font-semibold uppercase leading-[1.5] tracking-[0.01em] transition-colors md:text-[20px] ${
                activeTab === index
                  ? "border-[var(--cp-primary-500)] text-[var(--cp-primary-500)]"
                  : "border-transparent text-[var(--cp-primary-500)] hover:border-[var(--cp-primary-350)] hover:text-[var(--cp-primary-350)]"
              }`}
              data-tina-field={tab.raw ? tinaField(tab.raw, "label") : undefined}
              key={`${tab.label}-${index}`}
              onClick={() => {
                setActiveTab(index);
                setOpenIndex(0);
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 w-full border-t border-[var(--cp-primary-100)] md:mt-10">
        {currentTab.faqs.map((faq, index) => (
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
    </>
  );
}
