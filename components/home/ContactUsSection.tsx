"use client";

import { tinaField } from "tinacms/dist/react";
import ContactForm from "@/components/home/ContactForm";

interface ContactUsSectionProps {
  block: Record<string, unknown>;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export default function ContactUsSection({ block }: ContactUsSectionProps) {
  const contactImage = text(block.image, "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/uploads/site-assets/figma/home/contact-figma.jpg");

  return (
    <section className="bg-[var(--cp-brand-neutral-100)]" data-tina-field={tinaField(block)}>
      <div className="mx-auto w-full max-w-[1440px] md:grid md:grid-cols-[720px_720px]">
        <div className="px-[43px] pb-12 pt-[35px] md:pl-[79px] md:pr-[91px] md:pb-[82px] md:pt-16">
          <h2 className="text-[32px] uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]" data-tina-field={tinaField(block, "title")}>
            {text(block.title, "Contact us")}
          </h2>

          <div className="mt-[54px] w-full max-w-[550px] md:mt-[39px]">
            <ContactForm
              emailLabel={text(block.emailLabel, "Email")}
              emailLabelField={tinaField(block, "emailLabel")}
              emailPlaceholder={text(block.emailPlaceholder, "Enter your email")}
              emailPlaceholderField={tinaField(block, "emailPlaceholder")}
              messageLabel={text(block.messageLabel, "Project Idea (optional)")}
              messageLabelField={tinaField(block, "messageLabel")}
              messagePlaceholder={text(block.messagePlaceholder, "Tell us more about your project")}
              messagePlaceholderField={tinaField(block, "messagePlaceholder")}
              nameLabel={text(block.nameLabel, "Name")}
              nameLabelField={tinaField(block, "nameLabel")}
              namePlaceholder={text(block.namePlaceholder, "Enter your name")}
              namePlaceholderField={tinaField(block, "namePlaceholder")}
              submitLabel={text(block.submitLabel, "Send request")}
              submitLabelField={tinaField(block, "submitLabel")}
            />
          </div>
        </div>

        <div className="h-[380px] overflow-hidden bg-[var(--cp-primary-100)] md:h-[697px] md:w-[720px]" data-tina-field={tinaField(block, "image")}>
          <img alt="Contact section" className="h-full w-full object-cover" src={contactImage} />
        </div>
      </div>
    </section>
  );
}
