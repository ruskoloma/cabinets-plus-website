import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

function MobileSearchField() {
  return (
    <form action="/search" className="cp-input-shell mx-auto h-12 w-full max-w-[361px] bg-white md:hidden">
      <Image alt="" aria-hidden className="cp-input-shell__icon" height={24} src="/library/header/nav-search.svg" width={24} />
      <input
        aria-label="Search"
        className="cp-input-shell__input"
        name="q"
        placeholder="Enter name of a product or its code."
        type="search"
      />
      <Link
        aria-label="Open search page"
        className="text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-primary-350)]"
        href="/search"
      >
        <Image alt="" aria-hidden className="h-6 w-6" height={24} src="/library/header/nav-close.svg" width={24} />
      </Link>
    </form>
  );
}

export default function NotFound() {
  return (
    <div className="bg-white">
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-6 md:px-0 md:pb-[88px] md:pt-0">
        <MobileSearchField />

        <div className="mx-auto flex min-h-[651px] max-w-[361px] flex-col items-center pt-[149px] text-center md:min-h-[826px] md:max-w-none md:px-[120px] md:pt-[140px]">
          <h1 className="font-[var(--font-red-hat-display)] text-[40px] font-semibold uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px] md:font-normal">
            Page Not Found
          </h1>

          <p className="mt-5 max-w-[314px] font-[var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:max-w-[1000px] md:text-[24px]">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or no longer exists.
            Return to Home or explore our services.
          </p>

          <Button
            className="mt-[28px] !w-[228px] md:mt-5 md:!w-auto md:!px-8"
            href="/"
            variant="primary"
          >
            Go To Homepage
          </Button>
        </div>
      </section>
    </div>
  );
}
