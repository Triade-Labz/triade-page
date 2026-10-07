// Injeta o HTML pré-renderizado (src/prerender.tsx) nas páginas de dist/.
import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const ssrDir = join(root, "node_modules", ".prerender");
const { pages } = await import(pathToFileURL(join(ssrDir, "prerender.js")).href);

for (const [file, render] of Object.entries(pages)) {
  const path = join(root, "dist", file);
  const html = await readFile(path, "utf8");
  const marker = '<div id="root"></div>';
  if (!html.includes(marker)) throw new Error(`${file}: marcador ${marker} não encontrado`);
  await writeFile(path, html.replace(marker, `<div id="root">${render()}</div>`));
  console.log(`pré-renderizado: dist/${file}`);
}

await rm(ssrDir, { recursive: true, force: true });
