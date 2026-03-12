"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";

interface ContactFormProps {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitLabel: string;
  nameLabelField?: string;
  namePlaceholderField?: string;
  emailLabelField?: string;
  emailPlaceholderField?: string;
  messageLabelField?: string;
  messagePlaceholderField?: string;
  submitLabelField?: string;
}

export default function ContactForm({
  nameLabel,
  namePlaceholder,
  emailLabel,
  emailPlaceholder,
  messageLabel,
  messagePlaceholder,
  submitLabel,
  nameLabelField,
  namePlaceholderField,
  emailLabelField,
  emailPlaceholderField,
  messageLabelField,
  messagePlaceholderField,
  submitLabelField,
}: ContactFormProps) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <form className="space-y-[17px] md:space-y-8" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-base font-medium leading-[1.2] text-[var(--cp-primary-500)]" data-tina-field={nameLabelField}>
          {nameLabel} <span className="opacity-80">*</span>
        </label>
        <input
          className="h-[33px] w-full rounded-[2px] border border-[var(--cp-primary-100)] bg-[var(--cp-brand-neutral-50)] px-4 text-base text-[var(--cp-primary-500)] outline-none transition-colors focus:border-[var(--cp-brand-neutral-300)] md:h-[60px]"
          data-tina-field={namePlaceholderField}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder={namePlaceholder}
          required
          type="text"
          value={form.name}
        />
      </div>

      <div>
        <label className="mb-1 block text-base font-medium leading-[1.2] text-[var(--cp-primary-500)]" data-tina-field={emailLabelField}>
          {emailLabel} <span className="opacity-80">*</span>
        </label>
        <input
          className="h-[33px] w-full rounded-[2px] border border-[var(--cp-primary-100)] bg-[var(--cp-brand-neutral-50)] px-4 text-base text-[var(--cp-primary-500)] outline-none transition-colors focus:border-[var(--cp-brand-neutral-300)] md:h-[60px]"
          data-tina-field={emailPlaceholderField}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder={emailPlaceholder}
          required
          type="email"
          value={form.email}
        />
      </div>

      <div>
        <label className="mb-1 block text-base font-medium leading-[1.2] text-[var(--cp-primary-500)]" data-tina-field={messageLabelField}>
          {messageLabel}
        </label>
        <textarea
          className="h-[87px] w-full resize-none rounded-[2px] border border-[var(--cp-primary-100)] bg-[var(--cp-brand-neutral-50)] px-4 py-3 text-base text-[var(--cp-primary-500)] outline-none transition-colors focus:border-[var(--cp-brand-neutral-300)] md:h-[160px]"
          data-tina-field={messagePlaceholderField}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          placeholder={messagePlaceholder}
          value={form.message}
        />
      </div>

      <Button className="w-full" dataTinaField={submitLabelField} size="large" type="submit" variant="secondary">
        {submitLabel}
      </Button>
    </form>
  );
}
