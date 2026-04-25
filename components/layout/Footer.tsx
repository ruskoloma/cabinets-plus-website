import Link from "next/link";
import { tinaField } from "tinacms/dist/react";
import FallbackImg from "@/components/ui/FallbackImg";
import TextLink from "@/components/ui/TextLink";

interface FooterLink {
  label: string;
  href: string;
}

interface GlobalData {
  siteName: string;
  footerLogo?: string;
  phone?: string;
  address?: string;
  email?: string;
  copyrightText?: string;
  footerLinks?: FooterLink[];
  pinterestUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
}

const PINTEREST_URL = "https://www.pinterest.com/";
const FOOTER_TPM_LOGO = "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-membership-mobile-bottom.png";
const FOOTER_SHBA_LOGO = "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/assets/trust-shba.png";

function FooterLinkItem({ href, children, field }: { href: string; children: React.ReactNode; field?: string }) {
  return (
    <TextLink className="block whitespace-nowrap" dataTinaField={field} href={href} size="large" tone="white">
      {children}
    </TextLink>
  );
}

function SocialIcon({ href, src, alt, field }: { href: string; src: string; alt: string; field?: string }) {
  return (
    <a aria-label={alt} className="transition-opacity hover:opacity-80" data-tina-field={field} href={href} rel="noreferrer" target="_blank">
      <img alt="" aria-hidden className="h-8 w-8" src={src} />
    </a>
  );
}

function FooterMembershipLogo() {
  return (
    <div className="flex h-[49.256px] w-[213.802px] items-center gap-[18px] opacity-80">
      <FallbackImg alt="TPM" className="h-[49.256px] w-[34.604px] object-contain" src={FOOTER_TPM_LOGO} variant="thumb" />
      <FallbackImg alt="Spokane Home Builders Association" className="h-[49.256px] w-[160.697px] object-contain" src={FOOTER_SHBA_LOGO} variant="thumb" />
    </div>
  );
}

function FooterContactRow({ iconSrc, value, field }: { iconSrc: string; value: string; field?: string }) {
  return (
    <p className="flex items-center gap-[19px] text-[16px] leading-6 text-white" data-tina-field={field}>
      <img alt="" aria-hidden className="h-5 w-5" src={iconSrc} />
      <span>{value}</span>
    </p>
  );
}

export default function Footer({
  data,
  footerRaw,
  generalRaw,
}: {
  data: GlobalData;
  footerRaw: Record<string, unknown>;
  generalRaw: Record<string, unknown>;
}) {
  const allLinks = (data.footerLinks || []).map((link, index) => ({
    ...link,
    field: tinaField(footerRaw, `footerLinks.${index}`),
  }));
  const serviceLinks = allLinks.slice(0, 5);
  const pageLinks = allLinks.slice(5, 8);
  const legalLinks = allLinks.slice(8, 12);
  const primaryAddress = (data.address || "").split(",")[0].trim();
  const phone = data.phone || "";
  const email = data.email || "";
  const copyrightText = data.copyrightText || "© 2026 Cabinets Plus Spokane";
  const pinterestUrl = data.pinterestUrl || PINTEREST_URL;
  const instagramUrl = data.instagramUrl || "https://instagram.com";
  const facebookUrl = data.facebookUrl || "https://facebook.com";
  const desktopContactRows = [
    { iconSrc: "/library/footer/footer-icon-location.svg", value: primaryAddress, field: tinaField(generalRaw, "address") },
    { iconSrc: "/library/footer/footer-icon-phone.svg", value: phone, field: tinaField(generalRaw, "phone") },
    { iconSrc: "/library/footer/footer-icon-mail.svg", value: email, field: tinaField(generalRaw, "email") },
  ];
  const mobileContactRows = [
    { iconSrc: "/library/footer/footer-icon-location.svg", value: primaryAddress, field: tinaField(generalRaw, "address") },
    { iconSrc: "/library/footer/footer-icon-mail.svg", value: email, field: tinaField(generalRaw, "email") },
    { iconSrc: "/library/footer/footer-icon-phone.svg", value: phone, field: tinaField(generalRaw, "phone") },
  ];

  return (
    <footer className="bg-[var(--cp-brand-neutral-800)] text-white">
      <div className="cp-container hidden h-[373px] px-8 pb-[55px] pt-[29px] md:block">
        <div className="flex items-start justify-between">
          <Link aria-label={data.siteName || "Cabinets Plus"} href="/">
            {data.footerLogo ? (
              <FallbackImg
                alt={data.siteName || "Cabinets Plus"}
                className="h-[46.87px] w-[240px]"
                data-tina-field={tinaField(footerRaw, "footerLogo")}
                src={data.footerLogo}
                variant="thumb"
              />
            ) : (
              <span className="font-[var(--font-red-hat-display)] text-2xl font-semibold uppercase tracking-wide">{data.siteName}</span>
            )}
          </Link>

          <p className="pt-[13px] text-[16px] leading-[normal] text-white/95" data-tina-field={tinaField(footerRaw, "copyrightText")}>
            {copyrightText}
          </p>

          <div className="flex items-center gap-14 pt-2">
            <p className="font-[var(--font-red-hat-display)] text-[18px] font-semibold uppercase tracking-[0.01em] text-white">Follow us:</p>
            <div className="flex items-center gap-6">
              <SocialIcon alt="Pinterest" field={tinaField(generalRaw, "pinterestUrl")} href={pinterestUrl} src="/library/footer/footer-social-pinterest.svg" />
              <SocialIcon alt="Instagram" field={tinaField(generalRaw, "instagramUrl")} href={instagramUrl} src="/library/footer/footer-social-instagram.svg" />
              <SocialIcon alt="Facebook" field={tinaField(generalRaw, "facebookUrl")} href={facebookUrl} src="/library/footer/footer-social-facebook.svg" />
            </div>
          </div>
        </div>

        <div className="mt-[26px] h-px bg-white/20" />

        <div className="mt-[30px] flex items-start justify-between">
          <div className="w-[262px] space-y-4">
            {desktopContactRows.map((row) => (
              <FooterContactRow field={row.field} iconSrc={row.iconSrc} key={`${row.iconSrc}-${row.value}`} value={row.value} />
            ))}
          </div>

          <div className="flex w-[506px] justify-between" data-tina-field={tinaField(footerRaw, "footerLinks")}>
            <div className="w-[134px] space-y-4">
              {serviceLinks.map((link, index) => (
                <FooterLinkItem field={link.field} href={link.href} key={`${link.href}-${link.label}-${index}`}>
                  {link.label}
                </FooterLinkItem>
              ))}
            </div>

            <div className="w-[66px] space-y-4">
              {pageLinks.map((link, index) => (
                <FooterLinkItem field={link.field} href={link.href} key={`${link.href}-${link.label}-${index}`}>
                  {link.label}
                </FooterLinkItem>
              ))}
            </div>

            <div className="w-[98px] space-y-4">
              {legalLinks.map((link, index) => (
                <FooterLinkItem field={link.field} href={link.href} key={`${link.href}-${link.label}-${index}`}>
                  {link.label}
                </FooterLinkItem>
              ))}
            </div>
          </div>

          <FooterMembershipLogo />
        </div>
      </div>

      <div className="cp-container px-4 pb-[63px] pt-[46px] md:hidden">
        <Link aria-label={data.siteName || "Cabinets Plus"} href="/">
          {data.footerLogo ? (
            <FallbackImg
              alt={data.siteName || "Cabinets Plus"}
              className="h-[46.87px] w-[240px]"
              data-tina-field={tinaField(footerRaw, "footerLogo")}
              src={data.footerLogo}
              variant="thumb"
            />
          ) : (
            <span className="font-[var(--font-red-hat-display)] text-2xl font-semibold uppercase tracking-wide">{data.siteName}</span>
          )}
        </Link>

        <div className="mt-[17px] w-[262px] space-y-4">
          {mobileContactRows.map((row) => (
            <FooterContactRow field={row.field} iconSrc={row.iconSrc} key={`${row.iconSrc}-${row.value}`} value={row.value} />
          ))}
        </div>

        <div className="mt-[53px] text-[16px] leading-6 text-white" data-tina-field={tinaField(footerRaw, "footerLinks")}>
          <div className="space-y-4">
            {serviceLinks.map((link, index) => (
              <FooterLinkItem field={link.field} href={link.href} key={`m-svc-${link.href}-${index}`}>
                {link.label}
              </FooterLinkItem>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {pageLinks.map((link, index) => (
              <FooterLinkItem field={link.field} href={link.href} key={`m-pg-${link.href}-${index}`}>
                {link.label}
              </FooterLinkItem>
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {legalLinks.map((link, index) => (
              <FooterLinkItem field={link.field} href={link.href} key={`m-lg-${link.href}-${index}`}>
                {link.label}
              </FooterLinkItem>
            ))}
          </div>
        </div>

        <div className="mt-[65px]">
          <FooterMembershipLogo />
        </div>

        <div className="mt-[87px]">
          <p className="font-[var(--font-red-hat-display)] text-[18px] font-semibold uppercase leading-[1.5] tracking-[0.01em] text-white">Follow us:</p>
          <div className="mt-4 flex items-center gap-6">
            <SocialIcon alt="Pinterest" field={tinaField(generalRaw, "pinterestUrl")} href={pinterestUrl} src="/library/footer/footer-social-pinterest.svg" />
            <SocialIcon alt="Instagram" field={tinaField(generalRaw, "instagramUrl")} href={instagramUrl} src="/library/footer/footer-social-instagram.svg" />
            <SocialIcon alt="Facebook" field={tinaField(generalRaw, "facebookUrl")} href={facebookUrl} src="/library/footer/footer-social-facebook.svg" />
          </div>
        </div>

        <p className="mt-8 text-[16px] leading-[normal] text-white/95" data-tina-field={tinaField(footerRaw, "copyrightText")}>
          {copyrightText}
        </p>
      </div>
    </footer>
  );
}
