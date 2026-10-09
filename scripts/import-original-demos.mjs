// One-time, mechanical import of the original frontend dependency trees.
// Production configuration, environment files and customer records are never imported.
// Historical helper, NOT part of build. Re-imports must reapply all demo adapters and
// scope exclusions documented in docs/original-project-demos.md before publication.
import { mkdir, readFile, writeFile, copyFile, stat } from "node:fs/promises";
import { dirname, resolve, relative, extname } from "node:path";

const workspace = resolve(import.meta.dirname, "..");
const sources = resolve(workspace, "..");
const overrides = {
  lavandine: new Set(["lib/supabase.ts", "lib/mock-data.ts", "lib/site/initial-settings.json"]),
  reference: new Set([
    "integrations/supabase/client.ts",
    "lib/logger.ts",
    "modules/erp/Navigation.tsx",
  ]),
};

async function locate(base) {
  for (const candidate of [
    base,
    ...[".ts", ".tsx", ".js", ".json", ".css"].map((e) => base + e),
    resolve(base, "index.tsx"),
    resolve(base, "index.ts"),
  ]) {
    if (
      await stat(candidate)
        .then((s) => s.isFile())
        .catch(() => false)
    )
      return candidate;
  }
  throw new Error(`Missing frontend dependency: ${base}`);
}

async function snapshot(kind, folder, entrypoints) {
  const root = resolve(sources, folder, "src");
  const dest = resolve(workspace, "demos", kind, "original");
  const seen = new Set();
  async function visit(file) {
    const path = relative(root, file).replaceAll("\\", "/");
    if (seen.has(path) || overrides[kind].has(path)) return;
    if (path.startsWith("../") || /\.test\.|\.server\.|^server\//.test(path))
      throw new Error(`Non-frontend dependency: ${path}`);
    seen.add(path);
    const text = await readFile(file, "utf8");
    // Copy only frontend imports. Bare package imports stay with the site's dependencies.
    for (const match of text.matchAll(
      /(?:\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?)["']([^"']+)["']/g,
    )) {
      const spec = match[1].split("?")[0];
      if (spec.startsWith("@/") || spec.startsWith(".")) {
        await visit(
          await locate(
            spec.startsWith("@/") ? resolve(root, spec.slice(2)) : resolve(dirname(file), spec),
          ),
        );
      }
    }
    const target = resolve(dest, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
  }
  for (const entry of entrypoints) await visit(resolve(root, entry));
  console.log(`${kind}: ${seen.size} original frontend files imported`);
}

await snapshot("lavandine", "ControleLavandine", [
  ...[
    "index",
    "compras",
    "estoque",
    "producao",
    "produtos",
    "clientes",
    "vendas",
    "relatorios",
    "gerenciar-site",
  ].map((r) => `routes/${r}.tsx`),
  "lib/store.tsx",
  "lib/auth.tsx",
  "styles.css",
  "components/ui/sonner.tsx",
]);
await snapshot("reference", "NumerosReference", [
  ...[
    "route",
    "dashboard",
    "numeros.index",
    "numeros.$id",
    "dispositivos",
    "funcionarias.index",
    "funcionarias.$id",
    "historico",
    "entrada",
    "usuarios",
  ].map((r) => `routes/_authenticated/${r}.tsx`),
  "styles.css",
  "components/ui/sonner.tsx",
]);

for (const [folder, files, destination] of [
  [
    "EstalagemRestaurante",
    [
      "index.html",
      "assets/css/main.css",
      "assets/js/app.js",
      "assets/img/logo-estalagem.png",
      "assets/img/icon-192.png",
      "assets/img/whatsapp.avif",
    ],
    "estalagem",
  ],
  ["macauba-hortifruti", ["index.html", "styles.css", "app.js", "catalogo-produtos.js"], "macauba"],
  ["ControleLavandine", ["public/assets/logo-lavandine.png"], "lavandine"],
  [
    "NumerosReference",
    ["public/reference-symbol.png", "public/reference-wordmark.png"],
    "reference",
  ],
]) {
  for (const file of files) {
    const target = resolve(workspace, "demos", destination, file);
    await mkdir(dirname(target), { recursive: true });
    if ([".html", ".css", ".js"].includes(extname(file))) {
      await writeFile(
        target,
        (await readFile(resolve(sources, folder, file), "utf8")).replace(/\r\r?\n/g, "\n"),
      );
    } else await copyFile(resolve(sources, folder, file), target);
  }
}
