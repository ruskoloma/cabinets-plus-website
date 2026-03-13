import Link from "next/link";
import { tinaField } from "tinacms/dist/react";

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

function FooterLinkItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="block text-[16px] leading-6 text-white transition-colors hover:text-[var(--cp-brand-neutral-300)]" href={href}>
      {children}
    </Link>
  );
}

function FooterInlineLinks({ links }: { links: FooterLink[] }) {
  return (
    <>
      {links.map((link, index) => (
        <span className="inline-flex items-center" key={`${link.href}-${link.label}-${index}`}>
          <FooterLinkItem href={link.href}>{link.label}</FooterLinkItem>
          {index < links.length - 1 ? <span className="px-2 text-white">•</span> : null}
        </span>
      ))}
    </>
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
      <img alt="TPM" className="h-[49.256px] w-[34.604px] object-contain" src={FOOTER_TPM_LOGO} />
      <img alt="Spokane Home Builders Association" className="h-[49.256px] w-[160.697px] object-contain" src={FOOTER_SHBA_LOGO} />
    </div>
  );
}

export default function Footer({ data, raw }: { data: GlobalData; raw: Record<string, unknown> }) {
  const serviceLinks = data.footerLinks?.slice(0, 5) || [];
  const serviceLinksLine1 = serviceLinks.slice(0, 3);
  const serviceLinksLine2 = serviceLinks.slice(3, 5);
  const pageLinks = data.footerLinks?.slice(5, 8) || [];
  const legalLinks = data.footerLinks?.slice(8, 12) || [];
  const primaryAddress = (data.address || "").split(",")[0].trim();
  const phone = data.phone || "";
  const email = data.email || "";
  const copyrightText = data.copyrightText || "© 2026 Cabinets Plus Spokane";
  const pinterestUrl = data.pinterestUrl || PINTEREST_URL;
  const instagramUrl = data.instagramUrl || "https://instagram.com";
  const facebookUrl = data.facebookUrl || "https://facebook.com";

  return (
    <footer className="bg-[var(--cp-brand-neutral-800)] text-white">
      <div className="cp-container hidden h-[373px] px-8 pb-[55px] pt-[29px] md:block">
        <div className="flex items-start justify-between">
          <Link aria-label={data.siteName || "Cabinets Plus"} href="/">
            {data.footerLogo ? (
              <img
                alt={data.siteName || "Cabinets Plus"}
                className="h-[46.87px] w-[240px]"
                data-tina-field={tinaField(raw, "footerLogo")}
                src={data.footerLogo}
              />
            ) : (
              <span className="font-[var(--font-red-hat-display)] text-2xl font-semibold uppercase tracking-wide">{data.siteName}</span>
            )}
          </Link>

          <p className="pt-[13px] text-[16px] leading-[normal] text-white/95" data-tina-field={tinaField(raw, "copyrightText")}>
            {copyrightText}
          </p>

          <div className="flex items-center gap-14 pt-2">
            <p className="font-[var(--font-red-hat-display)] text-[18px] font-semibold uppercase tracking-[0.01em] text-white">Follow us:</p>
            <div className="flex items-center gap-6">
              <SocialIcon alt="Pinterest" field={tinaField(raw, "pinterestUrl")} href={pinterestUrl} src="/library/footer/footer-social-pinterest.svg" />
              <SocialIcon alt="Instagram" field={tinaField(raw, "instagramUrl")} href={instagramUrl} src="/library/footer/footer-social-instagram.svg" />
              <SocialIcon alt="Facebook" field={tinaField(raw, "facebookUrl")} href={facebookUrl} src="/library/footer/footer-social-facebook.svg" />
            </div>
          </div>
        </div>

        <div className="mt-[26px] h-px bg-white/20" />

        <div className="mt-[30px] flex items-start justify-between">
          <div className="w-[262px] space-y-4">
            <p className="flex items-center gap-[19px] text-[16px] leading-6 text-white" data-tina-field={tinaField(raw, "address")}>
              <img alt="" aria-hidden className="h-5 w-5" src="/library/footer/footer-icon-location.svg" />
              <span>{primaryAddress}</span>
            </p>
            <p className="flex items-center gap-[19px] text-[16px] leading-6 text-white" data-tina-field={tinaField(raw, "phone")}>
              <img alt="" aria-hidden className="h-5 w-5" src="/library/footer/footer-icon-mail.svg" />
              <span>{phone}</span>
            </p>
            <p className="flex items-center gap-[19px] text-[16px] leading-6 text-white" data-tina-field={tinaField(raw, "email")}>
              <img alt="" aria-hidden className="h-5 w-5" src="/library/footer/footer-icon-phone.svg" />
              <span>{email}</span>
            </p>
          </div>

          <div className="flex w-[506px] justify-between">
            <div className="w-[134px] space-y-4">
              {serviceLinks.map((link, index) => (
                <FooterLinkItem href={link.href} key={`${link.href}-${link.label}-${index}`}>
                  {link.label}
                </FooterLinkItem>
              ))}
            </div>

            <div className="w-[66px] space-y-4">
              {pageLinks.map((link, index) => (
                <FooterLinkItem href={link.href} key={`${link.href}-${link.label}-${index}`}>
                  {link.label}
                </FooterLinkItem>
              ))}
            </div>

            <div className="w-[98px] space-y-4">
              {legalLinks.map((link, index) => (
                <FooterLinkItem href={link.href} key={`${link.href}-${link.label}-${index}`}>
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
            <img
              alt={data.siteName || "Cabinets Plus"}
              className="h-[46.87px] w-[240px]"
              data-tina-field={tinaField(raw, "footerLogo")}
              src={data.footerLogo}
            />
          ) : (
            <span className="font-[var(--font-red-hat-display)] text-2xl font-semibold uppercase tracking-wide">{data.siteName}</span>
          )}
        </Link>

        <div className="mt-[17px] w-[262px] space-y-4">
          <p className="flex items-center gap-[19px] text-[16px] leading-6 text-white" data-tina-field={tinaField(raw, "address")}>
            <img alt="" aria-hidden className="h-5 w-5" src="/library/footer/footer-icon-location.svg" />
            <span>{primaryAddress}</span>
          </p>
          <p className="flex items-center gap-[19px] text-[16px] leading-6 text-white" data-tina-field={tinaField(raw, "phone")}>
            <img alt="" aria-hidden className="h-5 w-5" src="/library/footer/footer-icon-mail.svg" />
            <span>{phone}</span>
          </p>
          <p className="flex items-center gap-[19px] text-[16px] leading-6 text-white" data-tina-field={tinaField(raw, "email")}>
            <img alt="" aria-hidden className="h-5 w-5" src="/library/footer/footer-icon-phone.svg" />
            <span>{email}</span>
          </p>
        </div>

        <div className="mt-[53px] w-[361px] text-[16px] leading-6 text-white">
          <p className="flex items-center">
            <FooterInlineLinks links={serviceLinksLine1} />
          </p>
          <p className="flex items-center">
            <FooterInlineLinks links={serviceLinksLine2} />
          </p>
          <p className="mt-6 flex items-center">
            <FooterInlineLinks links={pageLinks} />
          </p>
          <p className="mt-8 flex items-center">
            <FooterInlineLinks links={legalLinks} />
          </p>
        </div>

        <div className="mt-[41px]">
          <FooterMembershipLogo />
        </div>

        <div className="mt-[87px]">
          <p className="font-[var(--font-red-hat-display)] text-[18px] font-semibold uppercase leading-[1.5] tracking-[0.01em] text-white">Follow us:</p>
          <div className="mt-4 flex items-center gap-6">
            <SocialIcon alt="Pinterest" field={tinaField(raw, "pinterestUrl")} href={pinterestUrl} src="/library/footer/footer-social-pinterest.svg" />
            <SocialIcon alt="Instagram" field={tinaField(raw, "instagramUrl")} href={instagramUrl} src="/library/footer/footer-social-instagram.svg" />
            <SocialIcon alt="Facebook" field={tinaField(raw, "facebookUrl")} href={facebookUrl} src="/library/footer/footer-social-facebook.svg" />
          </div>
        </div>

        <p className="mt-8 text-[16px] leading-[normal] text-white/95" data-tina-field={tinaField(raw, "copyrightText")}>
          {copyrightText}
        </p>
      </div>
    </footer>
  );
}
