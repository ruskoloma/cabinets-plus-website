"use client";

import { tinaField } from "tinacms/dist/react";
import { useGlobal, useGlobalRawDocument } from "@/components/layout/GlobalContext";
import FillImage from "@/components/ui/FillImage";

interface OurShowroomSectionProps {
  block: Record<string, unknown>;
}

const DEFAULT_SHOWROOM_TEXTURE = "/library/catalog/countertop-marble.png";
const DEFAULT_MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2687.4219204649216!2d-117.34231340000001!3d47.6567994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x549e1f2329ca588f%3A0x5d5cbf04120a6e84!2sCabinets%20Plus!5e0!3m2!1sen!2sus!4v1772842605411!5m2!1sen!2sus";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function LocationIcon() {
  return <img alt="" aria-hidden className="h-10 w-10 md:h-12 md:w-12" src="/library/showroom/showroom-icon-location.svg" />;
}

function MailIcon() {
  return <img alt="" aria-hidden className="h-10 w-10 md:h-12 md:w-12" src="/library/showroom/showroom-icon-mail.svg" />;
}

function PhoneIcon() {
  return <img alt="" aria-hidden className="h-10 w-10 md:h-12 md:w-12" src="/library/showroom/showroom-icon-phone.svg" />;
}

function PinterestIcon() {
  return <img alt="" aria-hidden className="h-8 w-8 md:h-10 md:w-10" src="/library/showroom/showroom-social-pinterest.svg" />;
}

function InstagramIcon() {
  return <img alt="" aria-hidden className="h-8 w-8 md:h-10 md:w-10" src="/library/showroom/showroom-social-instagram.svg" />;
}

function FacebookIcon() {
  return <img alt="" aria-hidden className="h-8 w-8 md:h-10 md:w-10" src="/library/showroom/showroom-social-facebook.svg" />;
}

export default function OurShowroomSection({ block }: OurShowroomSectionProps) {
  const global = useGlobal();
  const generalRecord = useGlobalRawDocument("general");
  const mapEmbedUrl = text(block.mapEmbedUrl, DEFAULT_MAP_EMBED_URL);
  const textureSrc = text(block.texture) || DEFAULT_SHOWROOM_TEXTURE;
  const pinterestUrl = global.pinterestUrl || "https://www.pinterest.com/";

  return (
    <section className="relative overflow-hidden bg-[#f5f3ee] py-12 md:py-16" data-tina-field={tinaField(block)}>
      <div className="absolute inset-0" data-tina-field={tinaField(block, "texture")}>
        <FillImage
          alt=""
          aria-hidden
          className="object-cover"
          sizes="100vw"
          src={textureSrc}
          unoptimized
        />
      </div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/40" />

      <div className="cp-container relative px-4 md:px-0">
        <div className="mx-auto grid max-w-[1248px] gap-12 md:grid-cols-[412px_623px] md:justify-between md:gap-10">
          <div className="w-full">
            <h2
              className="text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] md:text-[48px]"
              data-tina-field={tinaField(block, "showroomTitle")}
            >
              {text(block.showroomTitle, "Our showroom")}
            </h2>

            <div className="mt-12 space-y-8 text-[var(--cp-primary-500)] md:mt-16">
              <div className="flex items-center gap-5">
                <LocationIcon />
                <div className="text-[16px] leading-[1.5] md:text-[18px]">
                  <p className="font-semibold" data-tina-field={tinaField(generalRecord, "address")}>
                    {global.address.split(",")[0].trim()}
                  </p>
                  <p data-tina-field={tinaField(generalRecord, "hours")}>{global.hours}</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <MailIcon />
                <p className="text-[16px] leading-[1.5] md:text-[18px]" data-tina-field={tinaField(generalRecord, "email")}>
                  {global.email}
                </p>
              </div>

              <div className="flex items-center gap-5">
                <PhoneIcon />
                <p className="text-[16px] leading-[1.5] md:text-[18px]" data-tina-field={tinaField(generalRecord, "phone")}>
                  {global.phone}
                </p>
              </div>
            </div>

            <div className="mt-12 md:mt-16">
              <p
                className="font-[var(--font-red-hat-display)] text-[20px] font-semibold leading-none md:text-[24px]"
                data-tina-field={tinaField(block, "followUsLabel")}
              >
                {text(block.followUsLabel, "Follow us")}
              </p>
              <div className="mt-4 flex items-center gap-4 md:gap-6">
                <a
                  aria-label="Pinterest"
                  className="transition-opacity hover:opacity-75"
                  data-tina-field={tinaField(generalRecord, "pinterestUrl")}
                  href={pinterestUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <PinterestIcon />
                </a>
                {global.instagramUrl ? (
                  <a
                    aria-label="Instagram"
                    className="transition-opacity hover:opacity-75"
                    data-tina-field={tinaField(generalRecord, "instagramUrl")}
                    href={global.instagramUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <InstagramIcon />
                  </a>
                ) : null}
                {global.facebookUrl ? (
                  <a
                    aria-label="Facebook"
                    className="transition-opacity hover:opacity-75"
                    data-tina-field={tinaField(generalRecord, "facebookUrl")}
                    href={global.facebookUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <FacebookIcon />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className="relative h-[322px] overflow-hidden rounded-[2px] bg-[var(--cp-primary-100)] md:h-[555px] md:w-[623px]"
            data-tina-field={tinaField(block, "mapEmbedUrl")}
          >
            <iframe
              allowFullScreen
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={mapEmbedUrl}
              title="Cabinets Plus map"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
