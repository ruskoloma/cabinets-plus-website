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
    <form className="cp-contact-form space-y-8" onSubmit={onSubmit}>
      <div>
        <label className="cp-field-label" data-tina-field={nameLabelField}>
          <span>{nameLabel}</span>
          <span className="cp-field-label__required">*</span>
        </label>
        <input
          className="cp-field-control"
          data-tina-field={namePlaceholderField}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder={namePlaceholder}
          required
          type="text"
          value={form.name}
        />
      </div>

      <div>
        <label className="cp-field-label" data-tina-field={emailLabelField}>
          <span>{emailLabel}</span>
          <span className="cp-field-label__required">*</span>
        </label>
        <input
          className="cp-field-control"
          data-tina-field={emailPlaceholderField}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder={emailPlaceholder}
          required
          type="email"
          value={form.email}
        />
      </div>

      <div>
        <label className="cp-field-label" data-tina-field={messageLabelField}>
          {messageLabel}
        </label>
        <textarea
          className="cp-field-control cp-field-control--textarea"
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
