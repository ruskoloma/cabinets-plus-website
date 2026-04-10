import ContactUsSection from "@/components/home/ContactUsSection";
import OurShowroomSection from "@/components/home/OurShowroomSection";
import type { BlockRecord } from "./block-types";

export default function ContactSectionBlock({ block }: { block: BlockRecord }) {
  const record = block as Record<string, unknown>;
  return (
    <>
      <ContactUsSection block={record} />
      <OurShowroomSection block={record} />
    </>
  );
}
