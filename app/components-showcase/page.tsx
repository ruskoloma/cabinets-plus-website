import Button from "@/components/ui/Button";
import TextLink from "@/components/ui/TextLink";
import PreviewCard from "@/components/home/PreviewCard";
import ProjectMosaic from "@/components/home/ProjectMosaic";
import FaqTabsAccordion from "@/components/home/FaqTabsAccordion";

const sampleFaq = [
  {
    label: "General Questions",
    faqs: [
      {
        question: "Can you provide advice on DIY projects?",
        answer: "Yes. We offer consultations for DIY projects and can help with selections, planning, and measurements.",
      },
      {
        question: "How can I check product availability?",
        answer: "Call 1-509-218-3349 or email info@spokanecabinetsplus.com and our team will confirm availability.",
      },
    ],
  },
  {
    label: "Countertops",
    faqs: [
      {
        question: "Do you fabricate countertops in-house?",
        answer: "Yes. In-house fabrication helps us control quality and improve turnaround times.",
      },
    ],
  },
];

export default function ComponentsShowcasePage() {
  return (
    <div className="bg-white text-[var(--cp-primary-500)]">
      <section className="cp-container px-4 py-12 md:px-8">
        <h1 className="text-[32px] uppercase tracking-[0.01em] md:text-[48px]">Components Showcase</h1>
        <p className="mt-3 max-w-[760px] text-lg leading-relaxed">
          Static preview page for reusable components used across the Figma-aligned homepage.
        </p>
      </section>

      <section className="cp-container px-4 py-8 md:px-8">
        <h2 className="text-[24px] uppercase md:text-[32px]">Buttons</h2>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button disabled>Disabled</Button>
          <Button size="small">Small</Button>
        </div>
      </section>

      <section className="cp-container px-4 py-8 md:px-8">
        <h2 className="text-[24px] uppercase md:text-[32px]">Links</h2>
        <div className="mt-6 flex flex-wrap items-center gap-8">
          <TextLink href="#" size="medium" tone="primary">
            Link - Medium
          </TextLink>
          <TextLink href="#" size="title" tone="neutral">
            Link - Title
          </TextLink>
          <TextLink href="#" size="large" tone="neutral">
            Link - List
          </TextLink>
          <TextLink disabled href="#" size="medium" tone="primary">
            Disabled
          </TextLink>
        </div>
      </section>

      <section className="cp-container px-4 py-8 md:px-8">
        <h2 className="text-[24px] uppercase md:text-[32px]">Cards</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <PreviewCard href="#" image="https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/product-cabinets.jpg" imageClassName="h-[320px]" title="cabinets" />
          <PreviewCard
            description="Cabinets Plus provides professional remodeling services in Spokane."
            image="https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/service-kitchen.jpg"
            imageClassName="h-[320px]"
            title="Kitchen remodel"
          />
          <PreviewCard
            description="Our semi-custom cabinets give you design flexibility without custom pricing."
            image="https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/feature-1.jpg"
            imageClassName="h-[320px]"
            title="More Design Freedom, Better Value"
          />
        </div>
      </section>

      <section className="bg-[var(--cp-brand-neutral-50)] py-8">
        <div className="cp-container px-4 md:px-8">
          <h2 className="text-[24px] uppercase md:text-[32px]">Project Mosaic</h2>
          <ProjectMosaic
            images={[
              "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-main.jpg",
              "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-2.jpg",
              "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-3.jpg",
              "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-4.jpg",
              "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/project-5.jpg",
            ]}
          />
        </div>
      </section>

      <section className="cp-container px-4 py-8 md:px-8">
        <h2 className="text-[24px] uppercase text-center md:text-[32px]">FAQ Tabs + Accordion</h2>
        <FaqTabsAccordion tabs={sampleFaq} />
      </section>
    </div>
  );
}
