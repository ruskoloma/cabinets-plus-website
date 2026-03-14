import Script from "next/script";

type ScriptPlacement = "head" | "body";

interface ParsedScript {
  async?: boolean;
  code?: string;
  defer?: boolean;
  id?: string;
  src?: string;
  type?: string;
}

function parseBooleanAttribute(source: string, attribute: string) {
  const pattern = new RegExp(`\\b${attribute}\\b`, "i");
  return pattern.test(source);
}

function parseStringAttribute(source: string, attribute: string) {
  const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "i");
  return source.match(pattern)?.[1]?.trim();
}

function parseSnippetToScripts(snippet?: string | null): ParsedScript[] {
  const value = snippet?.trim();
  if (!value) return [];

  if (!/<script\b/i.test(value)) {
    return [{ code: value }];
  }

  const matches = Array.from(value.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi));
  return matches.flatMap((match) => {
    const attributes = match[1] || "";
    const code = (match[2] || "").trim();
    const src = parseStringAttribute(attributes, "src");
    const parsed: ParsedScript = {
      async: parseBooleanAttribute(attributes, "async") || undefined,
      defer: parseBooleanAttribute(attributes, "defer") || undefined,
      id: parseStringAttribute(attributes, "id"),
      src,
      type: parseStringAttribute(attributes, "type"),
    };

    if (src || code) {
      return [{ ...parsed, code: src ? undefined : code }];
    }

    return [];
  });
}

export default function InjectedScripts({ placement, snippet }: { placement: ScriptPlacement; snippet?: string | null }) {
  const scripts = parseSnippetToScripts(snippet);
  if (!scripts.length) return null;

  const strategy = placement === "head" ? "beforeInteractive" : "afterInteractive";

  return (
    <>
      {scripts.map((script, index) => {
        const key = script.id || `${placement}-script-${index}`;

        if (script.src) {
          return (
            <Script
              async={script.async}
              defer={script.defer}
              id={key}
              key={key}
              src={script.src}
              strategy={strategy}
              type={script.type}
            />
          );
        }

        if (!script.code) return null;

        return <Script dangerouslySetInnerHTML={{ __html: script.code }} id={key} key={key} strategy={strategy} type={script.type} />;
      })}
    </>
  );
}
