import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadLocalePrompts, sortPrompts } from "./utils/cms-client.js";
import { SUPPORTED_LANGUAGES } from "./utils/i18n.js";
import { generateMarkdown } from "./utils/markdown-generator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

async function main() {
  for (const lang of SUPPORTED_LANGUAGES) {
    const prompts = await loadLocalePrompts(lang.localeFileName);
    const markdown = generateMarkdown(sortPrompts(prompts), lang.code);
    const outPath = path.join(root, lang.readmeFileName);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, markdown, "utf8");
    console.log(`Generated ${lang.readmeFileName}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
