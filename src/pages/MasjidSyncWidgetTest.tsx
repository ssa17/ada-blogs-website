import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const DEFAULT_BASE_URL = "https://masjidsync.co.uk";
const DEFAULT_MASJID_ID = "13341df1-d6b7-411d-9d4c-9811171bc111";
const SCRIPT_ELEMENT_ID = "masjidsync-widget-loader";
const DEFAULT_TEST_PAGE_ORIGIN = "https://syed-blogs.netlify.app";

type WidgetMode = "today" | "month";

type WidgetVariantDefinition = {
  key: string;
  label: string;
  description: string;
  mode: WidgetMode;
  showTitle: boolean;
  showLink: boolean;
};

type WidgetVariant = WidgetVariantDefinition & {
  url: string;
};

function normalizePreview(input: string | null): boolean {
  if (input == null || input.trim() === "") {
    return false;
  }

  const normalized = input.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return true;
}

const TODAY_VARIANTS: WidgetVariantDefinition[] = [
  {
    key: "today-standard",
    label: "Today - standard",
    description: "Default day card with both the masjid title and MasjidSync link visible.",
    mode: "today",
    showTitle: true,
    showLink: true,
  },
  {
    key: "today-link-only",
    label: "Today - link only",
    description: "Compact daily card with the title hidden but the powered-by link still available.",
    mode: "today",
    showTitle: false,
    showLink: true,
  },
  {
    key: "today-title-only",
    label: "Today - title only",
    description: "Daily card that keeps the masjid name visible but hides the outbound footer link.",
    mode: "today",
    showTitle: true,
    showLink: false,
  },
  {
    key: "today-minimal",
    label: "Today - minimal",
    description: "Smallest daily variant with both title and footer link hidden.",
    mode: "today",
    showTitle: false,
    showLink: false,
  },
];

const MONTH_VARIANTS: WidgetVariantDefinition[] = [
  {
    key: "month-standard",
    label: "Month - standard",
    description: "Full monthly timetable with both the masjid title and MasjidSync link visible.",
    mode: "month",
    showTitle: true,
    showLink: true,
  },
  {
    key: "month-link-only",
    label: "Month - link only",
    description: "Monthly timetable with the title hidden but the footer link still available.",
    mode: "month",
    showTitle: false,
    showLink: true,
  },
  {
    key: "month-title-only",
    label: "Month - title only",
    description: "Monthly timetable with the title visible and the footer link removed.",
    mode: "month",
    showTitle: true,
    showLink: false,
  },
  {
    key: "month-minimal",
    label: "Month - minimal",
    description: "Most compact monthly timetable with both title and link hidden.",
    mode: "month",
    showTitle: false,
    showLink: false,
  },
];

function normalizeBaseUrl(input: string | null): string {
  const candidate = input?.trim() || DEFAULT_BASE_URL;
  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

function buildWidgetUrl(
  baseUrl: string,
  masjidId: string,
  options: Pick<WidgetVariantDefinition, "mode" | "showTitle" | "showLink">,
  previewEnabled: boolean,
): string {
  const url = new URL(`${baseUrl}/widget/masjid/${encodeURIComponent(masjidId)}`);
  url.searchParams.set("mode", options.mode);

  if (!options.showTitle) {
    url.searchParams.set("title", "0");
  }

  if (!options.showLink) {
    url.searchParams.set("link", "0");
  }

  if (previewEnabled) {
    url.searchParams.set("preview", "1");
  }

  return url.toString();
}

function getDefaultHeight(mode: WidgetMode): string {
  return mode === "month" ? "760px" : "520px";
}

function buildHarnessUrl(
  pageOrigin: string,
  baseUrl: string,
  masjidId: string,
  previewEnabled: boolean,
): string {
  const url = new URL("/masjidsync-widget-test", `${pageOrigin.replace(/\/$/, "")}/`);

  if (baseUrl !== DEFAULT_BASE_URL) {
    url.searchParams.set("baseUrl", baseUrl);
  }

  if (masjidId !== DEFAULT_MASJID_ID) {
    url.searchParams.set("masjidId", masjidId);
  }

  if (previewEnabled) {
    url.searchParams.set("preview", "1");
  }

  return url.toString();
}

export default function MasjidSyncWidgetTest() {
  const [searchParams] = useSearchParams();
  const pageOrigin = typeof window !== "undefined" ? window.location.origin : DEFAULT_TEST_PAGE_ORIGIN;

  const baseUrl = useMemo(
    () => normalizeBaseUrl(searchParams.get("baseUrl")),
    [searchParams],
  );
  const masjidId = searchParams.get("masjidId")?.trim() || DEFAULT_MASJID_ID;
  const previewEnabled = useMemo(
    () => normalizePreview(searchParams.get("preview")),
    [searchParams],
  );
  const publicHarnessUrl = useMemo(
    () => buildHarnessUrl(pageOrigin, baseUrl, masjidId, false),
    [baseUrl, masjidId, pageOrigin],
  );
  const previewHarnessUrl = useMemo(
    () => buildHarnessUrl(pageOrigin, baseUrl, masjidId, true),
    [baseUrl, masjidId, pageOrigin],
  );
  const helperScriptUrl = useMemo(
    () => `${baseUrl}/masjidsync-widget.js`,
    [baseUrl],
  );
  const todayVariants = useMemo<WidgetVariant[]>(
    () => TODAY_VARIANTS.map((variant) => ({
      ...variant,
      url: buildWidgetUrl(baseUrl, masjidId, variant, previewEnabled),
    })),
    [baseUrl, masjidId, previewEnabled],
  );
  const monthVariants = useMemo<WidgetVariant[]>(
    () => MONTH_VARIANTS.map((variant) => ({
      ...variant,
      url: buildWidgetUrl(baseUrl, masjidId, variant, previewEnabled),
    })),
    [baseUrl, masjidId, previewEnabled],
  );
  const allVariants = useMemo(
    () => [...todayVariants, ...monthVariants],
    [todayVariants, monthVariants],
  );

  useEffect(() => {
    const existing = document.getElementById(SCRIPT_ELEMENT_ID);
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ELEMENT_ID;
    script.async = true;
    script.src = helperScriptUrl;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [helperScriptUrl]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          MasjidSync iframe test
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {previewEnabled ? "Preview embed test page" : "Public embed test page"}
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          This page embeds the MasjidSync widget for masjid <span className="font-mono text-foreground">{masjidId}</span> so you can test it on a public Netlify site. By default it points at <span className="font-mono text-foreground">{baseUrl}</span>, and you can override that with <span className="font-mono text-foreground">?baseUrl=...</span> if you want to test a deploy preview.
        </p>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Every supported variant is rendered below: standard, link-only, title-only, and minimal, for both the today and month modes. This harness now defaults to the same public route used by copied snippets. Use the preview override URL below when you need to render a hidden masjid for admin testing.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Current widget targets</h2>
          <p className="text-sm text-muted-foreground">
            The resize helper script is loaded from the same MasjidSync origin as the iframe content.
          </p>
          <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Current data mode</p>
            <p className="mt-1">
              {previewEnabled
                ? "Preview mode is on, so hidden or disabled masjids can render for testing."
                : "Public mode is on, so hidden or disabled masjids will return 404 until they are listed publicly."}
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground">Public test page URL</p>
            <a className="break-all text-primary underline underline-offset-4" href={publicHarnessUrl} target="_blank" rel="noreferrer">
              {publicHarnessUrl}
            </a>
          </div>
          <div>
            <p className="font-medium text-foreground">Preview override URL</p>
            <a className="break-all text-primary underline underline-offset-4" href={previewHarnessUrl} target="_blank" rel="noreferrer">
              {previewHarnessUrl}
            </a>
          </div>
          <div>
            <p className="font-medium text-foreground">Helper script</p>
            <a className="break-all text-primary underline underline-offset-4" href={helperScriptUrl} target="_blank" rel="noreferrer">
              {helperScriptUrl}
            </a>
          </div>
          <div>
            <p className="font-medium text-foreground">Widget mode</p>
            <p className="text-muted-foreground">{previewEnabled ? "Preview override (preview=1)" : "Public data only"}</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Variant URLs</p>
            <div className="grid gap-2">
              {allVariants.map((variant) => (
                <div key={variant.key}>
                  <p className="text-foreground">{variant.label}</p>
                  <a className="break-all text-primary underline underline-offset-4" href={variant.url} target="_blank" rel="noreferrer">
                    {variant.url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Today mode variants</h2>
          <p className="text-sm text-muted-foreground">
            These phone-width frames are the quickest way to compare how the day card behaves across all supported title and link combinations.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {todayVariants.map((variant) => (
            <article key={variant.key} className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">{variant.label}</h3>
                <p className="text-sm text-muted-foreground">{variant.description}</p>
                <a className="break-all text-sm text-primary underline underline-offset-4" href={variant.url} target="_blank" rel="noreferrer">
                  Open widget URL
                </a>
              </div>
              <div className="rounded-[2rem] border bg-muted/20 p-3 shadow-inner">
                <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-[1.5rem] border bg-background shadow-lg">
                  <iframe
                    src={variant.url}
                    title={variant.label}
                    loading="lazy"
                    data-masjidsync-widget
                    style={{ width: "100%", border: 0, overflow: "hidden", minHeight: getDefaultHeight(variant.mode), display: "block" }}
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Month mode variants</h2>
          <p className="text-sm text-muted-foreground">
            These full-width timetable embeds cover the same toggle combinations, with extra attention on auto-height and avoiding nested scrolling.
          </p>
        </div>
        <div className="grid gap-6">
          {monthVariants.map((variant) => (
            <article key={variant.key} className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">{variant.label}</h3>
                <p className="text-sm text-muted-foreground">{variant.description}</p>
                <a className="break-all text-sm text-primary underline underline-offset-4" href={variant.url} target="_blank" rel="noreferrer">
                  Open widget URL
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                <iframe
                  src={variant.url}
                  title={variant.label}
                  loading="lazy"
                  data-masjidsync-widget
                  style={{ width: "100%", border: 0, overflow: "hidden", minHeight: getDefaultHeight(variant.mode), display: "block" }}
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}