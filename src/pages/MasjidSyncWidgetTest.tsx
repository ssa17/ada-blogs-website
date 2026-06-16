import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const DEFAULT_BASE_URL = "https://masjidsync.co.uk";
const LOCAL_DEV_BASE_URL = "http://localhost:5173";
const DEFAULT_MASJID_ID = "5b0e4d1b-6f58-4526-a672-374d7b496baf";
const SCRIPT_ELEMENT_ID = "masjidsync-widget-loader";
const DEFAULT_TEST_PAGE_ORIGIN = "https://syed-blogs.netlify.app";

type WidgetMode = "today" | "month";
type WidgetLayout = "full" | "compact";
type WidgetAppearance = "light" | "dark" | "auto";

type WidgetThemeConfig = {
  /** Preset id from MasjidSync (omit for brand default). */
  theme?: string;
  appearance?: WidgetAppearance;
  /** Accent hex without #, e.g. a16207 */
  accent?: string;
  label: string;
  swatch: string;
};

type WidgetVariantDefinition = {
  key: string;
  label: string;
  description: string;
  mode: WidgetMode;
  showTitle: boolean;
  layout: WidgetLayout;
  demoTheme: WidgetThemeConfig;
};

type WidgetVariant = WidgetVariantDefinition & {
  url: string;
  activeTheme: WidgetThemeConfig;
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
    key: "today-with-title",
    label: "Today - with masjid info",
    description: "Daily card with the masjid name and address above the prayer times.",
    mode: "today",
    showTitle: true,
    layout: "full",
    demoTheme: {
      label: "Brand green · light",
      swatch: "#1a6b4f",
      appearance: "light",
    },
  },
  {
    key: "today-without-title",
    label: "Today - without masjid info",
    description: "Daily card without the title block. The powered-by footer still stays visible.",
    mode: "today",
    showTitle: false,
    layout: "full",
    demoTheme: {
      theme: "forest",
      appearance: "dark",
      label: "Forest green · dark",
      swatch: "#145c3a",
    },
  },
];

const MONTH_VARIANTS: WidgetVariantDefinition[] = [
  {
    key: "month-full-with-title",
    label: "Month - full with masjid info",
    description: "Full-height monthly timetable with the masjid info header.",
    mode: "month",
    showTitle: true,
    layout: "full",
    demoTheme: {
      theme: "teal",
      appearance: "light",
      label: "Teal · light",
      swatch: "#0f766e",
    },
  },
  {
    key: "month-full-without-title",
    label: "Month - full without masjid info",
    description: "Full-height monthly timetable without the title block.",
    mode: "month",
    showTitle: false,
    layout: "full",
    demoTheme: {
      theme: "navy",
      appearance: "light",
      label: "Navy blue · light",
      swatch: "#1e3a5f",
    },
  },
  {
    key: "month-compact-with-title",
    label: "Month - compact with masjid info",
    description: "Compact monthly timetable with an internal scroll area for the month rows.",
    mode: "month",
    showTitle: true,
    layout: "compact",
    demoTheme: {
      theme: "slate",
      appearance: "dark",
      label: "Charcoal · dark",
      swatch: "#475569",
    },
  },
  {
    key: "month-compact-without-title",
    label: "Month - compact without masjid info",
    description: "Most compact month option, keeping only the table and the powered-by footer.",
    mode: "month",
    showTitle: false,
    layout: "compact",
    demoTheme: {
      theme: "burgundy",
      appearance: "light",
      label: "Burgundy · light",
      swatch: "#7f1d3d",
    },
  },
];

/** Extra theme demos appended after the layout variants (custom accent + gold preset). */
const BONUS_THEME_VARIANTS: WidgetVariantDefinition[] = [
  {
    key: "month-gold-preset",
    label: "Month - gold preset",
    description: "Full month table using the gold heritage preset from the MasjidSync theme picker.",
    mode: "month",
    showTitle: true,
    layout: "full",
    demoTheme: {
      theme: "gold",
      appearance: "light",
      label: "Gold · light",
      swatch: "#a16207",
    },
  },
  {
    key: "today-custom-accent",
    label: "Today - custom accent colour",
    description: "Daily card with a custom accent hex instead of a named preset (same option admins get from the colour picker).",
    mode: "today",
    showTitle: true,
    layout: "full",
    demoTheme: {
      accent: "c2410c",
      appearance: "light",
      label: "Custom accent · light",
      swatch: "#c2410c",
    },
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

type WidgetThemeOverrides = {
  theme?: string | null;
  appearance?: string | null;
  accent?: string | null;
};

function readThemeOverrides(searchParams: URLSearchParams): WidgetThemeOverrides {
  return {
    theme: searchParams.get("theme"),
    appearance: searchParams.get("appearance"),
    accent: searchParams.get("accent"),
  };
}

function mergeThemeConfig(
  variantTheme: WidgetThemeConfig,
  globalOverrides: WidgetThemeOverrides,
): WidgetThemeConfig {
  return {
    ...variantTheme,
    theme: globalOverrides.theme?.trim() || variantTheme.theme,
    appearance: (globalOverrides.appearance?.trim() as WidgetAppearance | undefined) || variantTheme.appearance,
    accent: globalOverrides.accent?.trim()?.replace(/^#/, "") || variantTheme.accent,
  };
}

function appendThemeConfig(url: URL, theme: WidgetThemeConfig): void {
  if (theme.theme?.trim() && theme.theme.trim() !== "default") {
    url.searchParams.set("theme", theme.theme.trim());
  }
  if (theme.appearance && theme.appearance !== "light") {
    url.searchParams.set("appearance", theme.appearance);
  }
  if (theme.accent?.trim()) {
    url.searchParams.set("accent", theme.accent.trim().replace(/^#/, ""));
  }
}

function appendThemeOverrides(url: URL, themeOverrides: WidgetThemeOverrides): void {
  appendThemeConfig(url, {
    label: "",
    swatch: "",
    theme: themeOverrides.theme ?? undefined,
    appearance: (themeOverrides.appearance as WidgetAppearance | undefined) ?? undefined,
    accent: themeOverrides.accent ?? undefined,
  });
}

function resolveVariant(
  baseUrl: string,
  masjidId: string,
  variant: WidgetVariantDefinition,
  previewEnabled: boolean,
  globalThemeOverrides: WidgetThemeOverrides,
): WidgetVariant {
  const activeTheme = mergeThemeConfig(variant.demoTheme, globalThemeOverrides);
  const url = new URL(`${baseUrl}/widget/masjid/${encodeURIComponent(masjidId)}`);
  url.searchParams.set("mode", variant.mode);

  if (!variant.showTitle) {
    url.searchParams.set("title", "0");
  }

  if (variant.mode === "month" && variant.layout === "compact") {
    url.searchParams.set("layout", "compact");
  }

  if (previewEnabled) {
    url.searchParams.set("preview", "1");
  }

  appendThemeConfig(url, activeTheme);

  return {
    ...variant,
    activeTheme,
    url: url.toString(),
  };
}

function getDefaultHeight(mode: WidgetMode, layout: WidgetLayout): string {
  if (mode === "month") {
    return layout === "compact" ? "620px" : "760px";
  }

  return "520px";
}

function ThemeBadge({ theme }: { theme: WidgetThemeConfig }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
      <span
        aria-hidden
        className="h-3 w-3 rounded-full border border-black/10 shadow-sm"
        style={{ backgroundColor: theme.swatch }}
      />
      {theme.label}
    </span>
  );
}

function WidgetVariantCard({ variant }: { variant: WidgetVariant }) {
  return (
    <article className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{variant.label}</h3>
          <ThemeBadge theme={variant.activeTheme} />
        </div>
        <p className="text-sm text-muted-foreground">{variant.description}</p>
        <a className="break-all text-sm text-primary underline underline-offset-4" href={variant.url} target="_blank" rel="noreferrer">
          Open widget URL
        </a>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <iframe
          src={variant.url}
          title={`${variant.label} (${variant.activeTheme.label})`}
          loading="lazy"
          data-masjidsync-widget
          style={{ width: "100%", border: 0, overflow: "hidden", minHeight: getDefaultHeight(variant.mode, variant.layout), display: "block" }}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </article>
  );
}

function buildHarnessUrl(
  pageOrigin: string,
  baseUrl: string,
  masjidId: string,
  previewEnabled: boolean,
  themeOverrides: WidgetThemeOverrides,
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

  appendThemeOverrides(url, themeOverrides);

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
  const themeOverrides = useMemo(
    () => readThemeOverrides(searchParams),
    [searchParams],
  );
  const localDevHarnessUrl = useMemo(
    () => buildHarnessUrl(pageOrigin, LOCAL_DEV_BASE_URL, masjidId, true, themeOverrides),
    [masjidId, pageOrigin, themeOverrides],
  );
  const publicHarnessUrl = useMemo(
    () => buildHarnessUrl(pageOrigin, baseUrl, masjidId, false, themeOverrides),
    [baseUrl, masjidId, pageOrigin, themeOverrides],
  );
  const previewHarnessUrl = useMemo(
    () => buildHarnessUrl(pageOrigin, baseUrl, masjidId, true, themeOverrides),
    [baseUrl, masjidId, pageOrigin, themeOverrides],
  );
  const helperScriptUrl = useMemo(
    () => `${baseUrl}/masjidsync-widget.js`,
    [baseUrl],
  );
  const todayVariants = useMemo<WidgetVariant[]>(
    () => TODAY_VARIANTS.map((variant) => resolveVariant(baseUrl, masjidId, variant, previewEnabled, themeOverrides)),
    [baseUrl, masjidId, previewEnabled, themeOverrides],
  );
  const monthVariants = useMemo<WidgetVariant[]>(
    () => MONTH_VARIANTS.map((variant) => resolveVariant(baseUrl, masjidId, variant, previewEnabled, themeOverrides)),
    [baseUrl, masjidId, previewEnabled, themeOverrides],
  );
  const bonusThemeVariants = useMemo<WidgetVariant[]>(
    () => BONUS_THEME_VARIANTS.map((variant) => resolveVariant(baseUrl, masjidId, variant, previewEnabled, themeOverrides)),
    [baseUrl, masjidId, previewEnabled, themeOverrides],
  );
  const allVariants = useMemo(
    () => [...todayVariants, ...monthVariants, ...bonusThemeVariants],
    [bonusThemeVariants, monthVariants, todayVariants],
  );
  const hasGlobalThemeOverride = Boolean(
    themeOverrides.theme?.trim() || themeOverrides.appearance?.trim() || themeOverrides.accent?.trim(),
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
          Every supported variant is rendered below: today with or without masjid info, plus month widgets in both full and compact layouts. The powered-by footer stays on in every case. Month widgets include Previous month, This month, and Next month controls inside the iframe.
        </p>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Each widget below uses a different demo theme (presets, dark mode, and a custom accent) so you can compare options side by side. Add <span className="font-mono text-foreground">theme=...</span>, <span className="font-mono text-foreground">appearance=...</span>, or <span className="font-mono text-foreground">accent=...</span> on this page URL to override every iframe at once.
        </p>
        {hasGlobalThemeOverride ? (
          <p className="max-w-3xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
            Global theme override is active from the page URL, so every widget below uses the same theme instead of its individual demo preset.
          </p>
        ) : null}
        <p className="max-w-3xl text-sm text-muted-foreground">
          To test local MasjidSync changes, run <span className="font-mono text-foreground">npm run dev</span> in masjidsync-web and open the local harness link below. Deploy previews work the same way with <span className="font-mono text-foreground">?baseUrl=https://your-preview-url</span>.
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
            <p className="font-medium text-foreground">Local dev harness (preview mode)</p>
            <a className="break-all text-primary underline underline-offset-4" href={localDevHarnessUrl} target="_blank" rel="noreferrer">
              {localDevHarnessUrl}
            </a>
          </div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground">{variant.label}</p>
                    <ThemeBadge theme={variant.activeTheme} />
                  </div>
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
            These daily embeds are rendered as normal full-width host blocks so the MasjidSync widget itself controls its final readable width.
          </p>
        </div>
        <div className="space-y-6">
          {todayVariants.map((variant) => (
            <WidgetVariantCard key={variant.key} variant={variant} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Month mode variants</h2>
          <p className="text-sm text-muted-foreground">
            These monthly embeds cover both title options and both layout options. Compact month variants keep the timetable rows scrollable inside the iframe.
          </p>
        </div>
        <div className="grid gap-6">
          {monthVariants.map((variant) => (
            <WidgetVariantCard key={variant.key} variant={variant} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Extra theme demos</h2>
          <p className="text-sm text-muted-foreground">
            Gold preset and a custom accent example. These use the same embed options available in the MasjidSync admin theme picker.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {bonusThemeVariants.map((variant) => (
            <WidgetVariantCard key={variant.key} variant={variant} />
          ))}
        </div>
      </div>
    </section>
  );
}