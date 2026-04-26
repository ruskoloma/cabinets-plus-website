import type { Metadata } from "next";
import Link from "next/link";
import FillImage from "@/components/ui/FillImage";
import Button from "@/components/ui/Button";
import { formatProductCode } from "@/components/special/cabinet-door/helpers";
import { getSearchResultsSafe } from "@/app/get-search-results-safe";

function textQuery(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function SearchField({
  defaultValue,
}: {
  defaultValue: string;
}) {
  return (
    <form action="/search" className="cp-input-shell h-12 w-full bg-white pl-6 pr-4 md:hidden">
      <button
        aria-label="Search"
        className="cp-input-shell__icon shrink-0 text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-primary-350)]"
        type="submit"
      >
        <img alt="" aria-hidden height="24" src="/library/header/nav-search.svg" width="24" />
      </button>
      <input
        aria-label="Search"
        className="cp-input-shell__input"
        defaultValue={defaultValue}
        name="q"
        placeholder="Enter name of a product or its code."
        type="search"
      />
      {defaultValue.trim() ? (
        <Link
          aria-label="Clear search"
          className="cp-input-shell__icon shrink-0 text-[var(--cp-primary-500)] transition-colors hover:text-[var(--cp-primary-350)]"
          href="/search"
        >
          <img alt="" aria-hidden height="24" src="/library/header/nav-close.svg" width="24" />
        </Link>
      ) : null}
    </form>
  );
}

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-end gap-6">
      <h2 className="[font-family:var(--font-red-hat-display)] text-[24px] font-normal uppercase leading-[1.25] text-[var(--cp-primary-500)] md:text-[32px]">
        {title}
      </h2>
      <p className="[font-family:var(--font-red-hat-display)] text-[18px] font-normal leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]">
        ({count} results)
      </p>
    </div>
  );
}

function ProductCard({
  href,
  image,
  title,
  subtitle,
}: {
  href: string;
  image: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link className="group block w-full" href={href}>
      <div className="relative aspect-square overflow-hidden bg-[var(--cp-primary-100)]">
        {image ? (
          <FillImage
            alt={title}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(min-width: 768px) 279px, 173px"
            src={image}
            variant="card"
          />
        ) : null}
      </div>
      <div className="mt-3 max-w-[270px]">
        <p className="[font-family:var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:text-[18px]">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-2 text-[16px] leading-none text-[var(--cp-primary-300)]">
            {formatProductCode(subtitle)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function ProjectCard({
  href,
  image,
  title,
}: {
  href: string;
  image: string;
  title: string;
}) {
  return (
    <Link className="group block" href={href}>
      <div className="relative h-[173px] overflow-hidden bg-[var(--cp-primary-100)] md:h-[286px]">
        <FillImage
          alt={title}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(min-width: 768px) 381px, 173px"
          src={image}
          variant="card"
        />
      </div>
      <p className="mt-2 [font-family:var(--font-red-hat-display)] text-[16px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)] md:mt-3 md:text-[24px]">
        {title}
      </p>
    </Link>
  );
}

function ArticleCard({
  href,
  image,
  title,
}: {
  href: string;
  image: string;
  title: string;
}) {
  return (
    <Link className="group block" href={href}>
      <div className="relative h-[203px] overflow-hidden bg-[var(--cp-primary-100)] md:h-[329px]">
        <FillImage
          alt={title}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(min-width: 768px) 586px, 361px"
          src={image}
          variant="feature"
        />
      </div>
      <p className="mt-2 [font-family:var(--font-red-hat-display)] text-[16px] font-semibold capitalize leading-[1.25] text-[var(--cp-primary-500)] md:mt-3 md:text-[24px]">
        {title}
      </p>
    </Link>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = textQuery(params.q).trim();

  return {
    title: query ? `Search: ${query}` : "Search",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawQuery = textQuery(params.q);
  const results = await getSearchResultsSafe(rawQuery);
  const hasQuery = results.query.trim().length > 0;
  const hasResults =
    results.products.length > 0 || results.projects.length > 0 || results.articles.length > 0;

  return (
    <div className="bg-white">
      <div className="cp-container px-4 pb-16 pt-6 md:px-[120px] md:pb-[88px] md:pt-[88px]">
        <SearchField defaultValue={results.query} />

        {hasQuery && hasResults ? (
          <>
            <div className="mt-12 md:mt-0">
              <p className="[font-family:var(--font-red-hat-display)] text-[14px] font-semibold leading-[1.25] text-[var(--cp-primary-500)] md:text-[24px]">
                Search results for:
              </p>
              <h1 className="mt-2 [font-family:var(--font-red-hat-display)] text-[32px] font-normal uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px]">
                {results.query}
              </h1>
            </div>

            {results.products.length ? (
              <section className="mt-12 md:mt-16">
                <SectionHeader count={results.products.length} title="Products" />
                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-[32px] md:grid-cols-4 md:gap-x-7 md:gap-y-12">
                  {results.products.map((item) => (
                    <ProductCard
                      href={item.href}
                      image={item.image}
                      key={`${item.kind}-${item.href}`}
                      subtitle={item.subtitle}
                      title={item.title}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {results.projects.length ? (
              <section className="mt-16 md:mt-[70px]">
                <SectionHeader count={results.projects.length} title="Projects" />
                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-[32px] md:grid-cols-3 md:gap-x-7 md:gap-y-12">
                  {results.projects.map((item) => (
                    <ProjectCard href={item.href} image={item.image} key={item.href} title={item.title} />
                  ))}
                </div>
              </section>
            ) : null}

            {results.articles.length ? (
              <section className="mt-16 md:mt-[70px]">
                <SectionHeader count={results.articles.length} title="Articles" />
                <div className="mt-8 grid gap-y-8 md:mt-[32px] md:grid-cols-2 md:gap-x-7 md:gap-y-12">
                  {results.articles.map((item) => (
                    <ArticleCard href={item.href} image={item.image} key={item.href} title={item.title} />
                  ))}
                </div>
              </section>
            ) : null}

          </>
        ) : hasQuery ? (
          <section className="mt-16 flex flex-col items-center gap-5 text-center md:mt-[140px]">
            <h2 className="[font-family:var(--font-red-hat-display)] text-[40px] font-semibold uppercase leading-[1.25] tracking-[0.01em] text-[var(--cp-primary-500)] md:text-[48px] md:font-normal">
              No results found
            </h2>
            <p className="max-w-[526px] [font-family:var(--font-red-hat-display)] text-[18px] font-semibold leading-[1.5] text-[var(--cp-primary-500)] md:text-[24px]">
              We couldn&apos;t find anything matching your search. Try different keywords or browse our services.
            </p>
            <Button className="!min-h-[56px] !px-8 !text-[20px]" href="/" variant="primary">
              Go To Homepage
            </Button>
          </section>
        ) : (
          <div className="hidden md:block md:min-h-[320px]" />
        )}
      </div>
    </div>
  );
}
