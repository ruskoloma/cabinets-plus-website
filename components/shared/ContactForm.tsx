"use client";

import { FormEvent, useId, useState } from "react";
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

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || "";
const SPAM_TERMS = [
  "backlink",
  "bitcoin",
  "casino",
  "cialis",
  "crypto",
  "guest post",
  "link building",
  "loan",
  "payday",
  "viagra",
];

function hasSpamSignals(...values: FormDataEntryValue[]): boolean {
  const content = values.map((value) => value.toString()).join(" ").toLowerCase();
  const linkCount = (content.match(/https?:\/\//g) || []).length;

  return linkCount > 2 || SPAM_TERMS.some((term) => content.includes(term));
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
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const honeyId = useId();
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    setStatus("submitting");
    setStatusMessage("");

    try {
      if (!WEB3FORMS_ACCESS_KEY) {
        throw new Error("Contact form is not configured. Please try again later.");
      }

      if (formData.get("botcheck")) {
        formElement.reset();
        setStatus("success");
        setStatusMessage("Thanks, your request was sent. We will get back to you shortly.");
        return;
      }

      if (hasSpamSignals(...formData.values())) {
        formElement.reset();
        setStatus("success");
        setStatusMessage("Thanks, your request was sent. We will get back to you shortly.");
        return;
      }

      formData.set("replyto", formData.get("email")?.toString() || "");
      formData.set("source_page", `${window.location.pathname}${window.location.search}`);

      const response = await fetch(WEB3FORMS_ENDPOINT, {
        body: JSON.stringify(Object.fromEntries(formData.entries())),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to send your request. Please try again.");
      }

      formElement.reset();
      setStatus("success");
      setStatusMessage("Thanks, your request was sent. We will get back to you shortly.");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to send your request. Please try again.");
    }
  };

  return (
    <form className="cp-contact-form space-y-8" onSubmit={onSubmit}>
      <input name="access_key" type="hidden" value={WEB3FORMS_ACCESS_KEY} />
      <input name="from_name" type="hidden" value="Cabinets Plus Website" />
      <input name="subject" type="hidden" value="New Cabinets Plus website request" />
      <div aria-hidden="true" className="cp-form-honey">
        <label htmlFor={honeyId}>Leave this field empty</label>
        <input autoComplete="off" id={honeyId} name="botcheck" tabIndex={-1} type="checkbox" />
      </div>

      {statusMessage ? (
        <p className={`cp-form-alert ${status === "error" ? "cp-form-alert--error" : ""}`} role="status">
          {statusMessage}
        </p>
      ) : null}

      <div>
        <label className="cp-field-label" data-tina-field={nameLabelField} htmlFor={nameId}>
          <span>{nameLabel}</span>
          <span className="cp-field-label__required">*</span>
        </label>
        <input
          autoComplete="name"
          className="cp-field-control"
          data-tina-field={namePlaceholderField}
          id={nameId}
          name="name"
          placeholder={namePlaceholder}
          required
          type="text"
        />
      </div>

      <div>
        <label className="cp-field-label" data-tina-field={emailLabelField} htmlFor={emailId}>
          <span>{emailLabel}</span>
          <span className="cp-field-label__required">*</span>
        </label>
        <input
          autoComplete="email"
          className="cp-field-control"
          data-tina-field={emailPlaceholderField}
          id={emailId}
          name="email"
          placeholder={emailPlaceholder}
          required
          type="email"
        />
      </div>

      <div>
        <label className="cp-field-label" data-tina-field={messageLabelField} htmlFor={messageId}>
          {messageLabel}
        </label>
        <textarea
          className="cp-field-control cp-field-control--textarea"
          data-tina-field={messagePlaceholderField}
          id={messageId}
          name="message"
          placeholder={messagePlaceholder}
        />
      </div>

      <Button className="w-full" dataTinaField={submitLabelField} disabled={status === "submitting"} size="large" type="submit" variant="secondary">
        {status === "submitting" ? "Sending..." : submitLabel}
      </Button>
    </form>
  );
}
