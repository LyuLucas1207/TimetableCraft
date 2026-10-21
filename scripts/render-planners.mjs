/** Server-render every planner with a template loaded, to catch render-time crashes without a browser. */
import assert from "node:assert/strict";
import { createServer } from "vite";

globalThis.localStorage = (() => { const map = new Map(); return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }; })();
const server = await createServer({ mode: "dev", server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const React = await import("react");
  const { renderToString } = await import("react-dom/server");
  const { MemoryRouter } = await import("react-router");
  const i18nMod = await server.ssrLoadModule("/src/providers/LanguageProvider/i18n.ts");
  const { I18nextProvider } = await import("react-i18next");
  const i18n = i18nMod.default ?? i18nMod.i18n;
  const { PLANNERS, TEMPLATES, buildTemplate } = await server.ssrLoadModule("/src/config/planners.ts");
  const { PLANNER_STORES } = await server.ssrLoadModule("/src/stores/planners.ts");
  const { default: Workspace } = await server.ssrLoadModule("/src/components/planner/PlannerWorkspace.tsx");
  for (const lng of ["en", "zh", "fr"]) {
    await i18n.changeLanguage(lng);
    for (const planner of PLANNERS) {
      for (const template of TEMPLATES[planner.id]) {
        const store = PLANNER_STORES[planner.id];
        store.getState().clear();
        const built = buildTemplate(planner.id, template.id, store.getState().document.date, (k) => i18n.t(k, { ns: "pages.Planner" }), (d) => i18n.t(`days.${d}`, { ns: "language" }));
        store.getState().appendEvents(built.events, built.columns ? { columns: built.columns } : undefined);
        const html = renderToString(React.createElement(I18nextProvider, { i18n }, React.createElement(MemoryRouter, null, React.createElement(Workspace, { planner }))));
        assert.ok(html.length > 2000, `${planner.id}/${template.id} rendered too little`);
        assert.doesNotMatch(html, /samples\.|templates\.|views\.[a-z]+\.[a-zA-Z]+|categories\./, `${lng} ${planner.id}/${template.id} shows a raw key`);
      }
    }
  }
  // Weekly opens on the grid, so render its overview directly.
  const { default: PlannerView } = await server.ssrLoadModule("/src/components/planner/PlannerViews.tsx");
  const weekly = PLANNERS.find((p) => p.id === "weekly");
  const doc = PLANNER_STORES.weekly.getState().document;
  const noop = () => {};
  const html = renderToString(React.createElement(I18nextProvider, { i18n }, React.createElement(PlannerView, { planner: weekly, doc, events: doc.events, segments: doc.events, title: "T", today: "2026-10-21",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], dateLabel: (d) => d, dayLabel: (d) => d, onEdit: noop, onCreate: noop, onPatch: noop, update: noop, toggleCheckin: noop, copyDay: noop, openSmartFill: noop })));
  assert.match(html, /role="progressbar"/);
  // Marketing pages carry the SEO copy; make sure they render and expose the head terms in every language.
  const { HelmetProvider } = await import("react-helmet-async");
  for (const [mod, name] of [["Home", "HomePage"], ["FAQ", "FAQPage"], ["Tools", "ToolsPage"]]) {
    const page = (await server.ssrLoadModule(`/src/pages/${mod}/index.tsx`)).default;
    for (const lng of ["en", "zh", "fr"]) {
      await i18n.changeLanguage(lng);
      const out = renderToString(React.createElement(HelmetProvider, null, React.createElement(I18nextProvider, { i18n }, React.createElement(MemoryRouter, null, React.createElement(page)))));
      assert.ok(out.length > 3000, `${mod}/${lng} too short`);
      assert.doesNotMatch(out, />(tools|samples|views)\.[a-zA-Z.]+</, `${mod}/${lng} shows a raw key`);
    }
  }
  const { default: PlannerPage } = await server.ssrLoadModule("/src/pages/Tools/Planner/index.tsx");
  await i18n.changeLanguage("en");
  for (const planner of PLANNERS) renderToString(React.createElement(HelmetProvider, null, React.createElement(I18nextProvider, { i18n }, React.createElement(MemoryRouter, null, React.createElement(PlannerPage, { planner })))));
  console.log("Rendered all planners in en/zh/fr with every template: no crashes, no raw i18n keys.");
} finally { await server.close(); }
