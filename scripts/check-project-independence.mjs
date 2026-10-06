import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const ignoredDirectories = new Set([
  ".git",
  ".superpowers",
  "node_modules",
  "dist",
  ".output",
  ".vinxi",
  ".tanstack",
  ".nitro",
]);
const binaryExtensions = new Set([
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
  ".woff",
  ".woff2",
]);
const forbiddenTokens = [
  ["lov", "able"].join(""),
  ["__", "l5e"].join(""),
  ["artificial", " intelligence"].join(""),
  ["inteligência", " artificial"].join(""),
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else if (!binaryExtensions.has(extname(entry.name).toLowerCase())) files.push(path);
  }

  return files;
}

const matches = [];
for (const file of await collectFiles(root)) {
  const contents = await readFile(file, "utf8");
  const lower = contents.toLocaleLowerCase("pt-BR");

  for (const token of forbiddenTokens) {
    if (lower.includes(token.toLocaleLowerCase("pt-BR"))) {
      matches.push(`${relative(root, file)}: ${token}`);
    }
  }
}

if (matches.length) {
  console.error("Foram encontradas referências externas proibidas:\n" + matches.join("\n"));
  process.exit(1);
}

console.log("Projeto independente: nenhuma referência proibida encontrada.");
