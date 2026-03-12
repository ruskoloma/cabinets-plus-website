import Button from "@/components/ui/Button";

interface TrustStat {
  value: string;
  label: string;
  tinaField?: string;
  valueField?: string;
  labelField?: string;
}

interface TrustPartnerLogo {
  src: string;
  alt: string;
  tinaField?: string;
  logoField?: string;
}

interface TrustBarProps {
  stripText: string;
  stripHighlight: string;
  stripTexture: string;
  stripTextField?: string;
  stripHighlightField?: string;
  stripTextureField?: string;
  stats: TrustStat[];
  membershipLogo?: string;
  membershipLogoField?: string;
  membershipMobileTopLogo?: string;
  membershipMobileTopLogoField?: string;
  membershipMobileBottomLogo?: string;
  membershipMobileBottomLogoField?: string;
  membershipLabel: string;
  membershipLabelField?: string;
  partnershipLabel: string;
  partnershipLabelField?: string;
  partnerLogos: TrustPartnerLogo[];
  ctaLabel: string;
  ctaLabelField?: string;
  ctaLink: string;
}

function splitWithHighlight(content: string, highlight: string) {
  if (!highlight || !content.includes(highlight)) {
    return { before: content, marked: "", after: "" };
  }

  const start = content.indexOf(highlight);
  const before = content.slice(0, start);
  const marked = content.slice(start, start + highlight.length);
  const after = content.slice(start + highlight.length);

  return { before, marked, after };
}

export default function TrustBar({
  stripText,
  stripHighlight,
  stripTexture,
  stripTextField,
  stripHighlightField,
  stripTextureField,
  stats,
  membershipLogo,
  membershipLogoField,
  membershipMobileTopLogo,
  membershipMobileTopLogoField,
  membershipMobileBottomLogo,
  membershipMobileBottomLogoField,
  membershipLabel,
  membershipLabelField,
  partnershipLabel,
  partnershipLabelField,
  partnerLogos,
  ctaLabel,
  ctaLabelField,
  ctaLink,
}: TrustBarProps) {
  const normalizedStats = stats.slice(0, 3);
  const desktopLogoHeights = ["md:h-[77px]", "md:h-[89px]", "md:h-[48px]", "md:h-[48px]", "md:h-[48px]", "md:h-[48px]"];
  const { before, marked, after } = splitWithHighlight(stripText, stripHighlight);
  const [logo1, logo2, logo3, logo4, logo5, logo6] = partnerLogos;
  const mobileTopMembershipLogo = membershipMobileTopLogo || membershipLogo;
  const mobileBottomMembershipLogo = membershipMobileBottomLogo;

  return (
    <>
      <section className="relative overflow-hidden bg-[var(--cp-brand-neutral-100)]">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-35"
          data-tina-field={stripTextureField}
          style={{ backgroundImage: `url(${stripTexture})` }}
        />
        <div className="cp-container relative px-4 py-[33px] md:px-8">
          <p className="mx-auto max-w-[1376px] text-center font-[var(--font-red-hat-display)] text-[20px] font-medium leading-[1.25] text-[var(--cp-primary-500)] md:text-[28px]" data-tina-field={stripTextField}>
            {before}
            {marked ? <strong className="font-black" data-tina-field={stripHighlightField}>{marked}</strong> : null}
            {after}
          </p>
        </div>
      </section>

      <section className="bg-[#262623] text-white">
        <div className="cp-container px-4 pb-10 pt-10 md:px-8 md:pb-[64px] md:pt-16">
          <div className="md:hidden">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-[30px]">
                {normalizedStats.map((stat, index) => (
                  <article className={index === 0 ? "w-[133px]" : index === 1 ? "w-[136px]" : "w-[123px]"} data-tina-field={stat.tinaField} key={`${stat.value}-${stat.label}-${index}`}>
                    <p className="text-[46.208px] font-light leading-none text-[var(--cp-brand-neutral-300)]" data-tina-field={stat.valueField}>
                      <span className="font-bold">{stat.value.replace("+", "")}</span>
                      {stat.value.includes("+") ? "+" : null}
                    </p>
                    <p className="mt-[2px] text-base font-semibold capitalize leading-[1.2] text-white" data-tina-field={stat.labelField}>{stat.label}</p>
                  </article>
                ))}
              </div>

              <div className="w-[172px]">
                <div className="relative h-[140px] w-[172px] opacity-80">
                  {mobileTopMembershipLogo ? (
                    <img alt="Spokane Home Builders Association" className="absolute left-0 top-0 h-[52.826px] w-[172px] object-contain" data-tina-field={membershipMobileTopLogoField || membershipLogoField} src={mobileTopMembershipLogo} />
                  ) : null}
                  {mobileBottomMembershipLogo ? (
                    <img alt="TPM" className="absolute left-0 top-[65.83px] h-[70.174px] w-[49.299px] object-contain" data-tina-field={membershipMobileBottomLogoField} src={mobileBottomMembershipLogo} />
                  ) : null}
                </div>
                <p className="mt-[6px] text-base font-semibold capitalize leading-[1.2] text-white" data-tina-field={membershipLabelField}>{membershipLabel}</p>
              </div>
            </div>

            <div className="mt-[43px] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <span className="h-px bg-white/20" />
              <p className="px-0.5 text-[20px] font-semibold capitalize leading-[1.2] text-white" data-tina-field={partnershipLabelField}>{partnershipLabel}</p>
              <span className="h-px bg-white/20" />
            </div>

            <div className="mt-[44px] relative h-[100px] w-full max-w-[361px]">
              {logo1 ? <img alt={logo1.alt} className="absolute left-0 top-[3.66px] h-[44.96px] w-[123.903px] object-contain opacity-40" data-tina-field={logo1.logoField || logo1.tinaField} src={logo1.src} /> : null}
              {logo2 ? <img alt={logo2.alt} className="absolute left-[157.88px] top-0 h-[52.28px] w-[39.923px] object-contain opacity-40" data-tina-field={logo2.logoField || logo2.tinaField} src={logo2.src} /> : null}
              {logo3 ? <img alt={logo3.alt} className="absolute left-[231.6px] top-[12.02px] h-[28.231px] w-[129.401px] object-contain opacity-40" data-tina-field={logo3.logoField || logo3.tinaField} src={logo3.src} /> : null}
              {logo4 ? <img alt={logo4.alt} className="absolute left-0 top-[74.08px] h-[22.57px] w-[126.249px] object-contain opacity-40" data-tina-field={logo4.logoField || logo4.tinaField} src={logo4.src} /> : null}
              {logo5 ? <img alt={logo5.alt} className="absolute left-[152.45px] top-[73.65px] h-[23.821px] w-[57.169px] object-contain opacity-40" data-tina-field={logo5.logoField || logo5.tinaField} src={logo5.src} /> : null}
              {logo6 ? <img alt={logo6.alt} className="absolute left-[242.97px] top-[71px] h-[28.74px] w-[117.951px] object-contain opacity-40" data-tina-field={logo6.logoField || logo6.tinaField} src={logo6.src} /> : null}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-[173px_174px_255px_413px] items-end justify-between">
              {normalizedStats.map((stat, index) => (
                <article className={index === 0 ? "w-[173px]" : index === 1 ? "w-[174px]" : "w-[255px]"} data-tina-field={stat.tinaField} key={`${stat.value}-${stat.label}-${index}`}>
                  <p className="text-[96px] font-light leading-none text-[var(--cp-brand-neutral-300)]" data-tina-field={stat.valueField}>
                    <span className="font-bold">{stat.value.replace("+", "")}</span>
                    {stat.value.includes("+") ? "+" : null}
                  </p>
                  <p className="mt-[7px] text-[20px] font-semibold capitalize leading-[1.2] text-white" data-tina-field={stat.labelField}>{stat.label}</p>
                </article>
              ))}

              <div className="w-[413px]">
                <div className="relative h-[96px] w-[413px] opacity-80">
                  {mobileBottomMembershipLogo ? (
                    <img alt="TPM" className="absolute left-0 top-0 h-[96px] w-[67.443px] object-contain" data-tina-field={membershipMobileBottomLogoField} src={mobileBottomMembershipLogo} />
                  ) : null}
                  {mobileTopMembershipLogo ? (
                    <img alt="Spokane Home Builders Association" className="absolute left-[100.443px] top-0 h-[96px] w-[312.572px] object-contain" data-tina-field={membershipMobileTopLogoField || membershipLogoField} src={mobileTopMembershipLogo} />
                  ) : membershipLogo ? (
                    <img alt="Spokane Home Builders Association" className="absolute left-[100.443px] top-0 h-[96px] w-[312.572px] object-contain" data-tina-field={membershipLogoField} src={membershipLogo} />
                  ) : null}
                </div>
                <p className="mt-[21px] text-[20px] font-semibold capitalize leading-[1.2] text-white" data-tina-field={membershipLabelField}>{membershipLabel}</p>
              </div>
            </div>

            <div className="mt-[46px] grid grid-cols-[1fr_auto_1fr] items-center gap-8">
              <span className="h-px bg-white/20" />
              <p className="px-0.5 text-[20px] font-semibold capitalize leading-[1.2] text-white" data-tina-field={partnershipLabelField}>{partnershipLabel}</p>
              <span className="h-px bg-white/20" />
            </div>

            <div className="mt-[57px] flex items-end justify-between">
              {partnerLogos.map((logo, index) => (
                <img alt={logo.alt} className={`${desktopLogoHeights[index] || "md:h-[48px]"} w-auto object-contain opacity-40`} data-tina-field={logo.logoField || logo.tinaField} key={`${logo.src}-desktop-${index}`} src={logo.src} />
              ))}
            </div>

            <div className="mt-[57px] text-center">
              <Button className="!border-white !text-white hover:!border-white hover:!bg-white/10 hover:!text-white" dataTinaField={ctaLabelField} href={ctaLink} variant="outline">
                {ctaLabel}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
