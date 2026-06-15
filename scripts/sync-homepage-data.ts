import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PromptRecord } from "./utils/cms-client.js";
import { SUPPORTED_LANGUAGES } from "./utils/i18n.js";

interface OfficialPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

interface OfficialCategory {
  id: string;
  name: string;
  prompts: OfficialPrompt[];
}

interface OfficialLocaleData {
  title: string;
  description: string;
  categories: OfficialCategory[];
}

interface TwitterPromptBase {
  id: string;
  title: string;
  description: string;
  prompt: string;
  tags: string[];
  difficulty: string;
  duration: string;
  source: string;
  sourceUrl: string;
  author: string;
}

interface TwitterLocalizedPrompt {
  id: string;
  title: string;
  description: string;
  tags: string[];
  prompt?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const sourceDataRoot = path.resolve(root, "../homepage-v2/src/data");
const outputDataRoot = path.join(root, "data");
const promptsByLocaleRoot = path.join(outputDataRoot, "prompts_by_locale");

const localeToOfficialFile: Record<string, string> = {
  en: "seedance20-prompts-en.json",
  zh: "seedance20-prompts-zh-CN.json",
  "zh-TW": "seedance20-prompts-zh-TW.json",
  ja: "seedance20-prompts-ja.json",
  ko: "seedance20-prompts-ko.json",
  es: "seedance20-prompts-es.json",
  fr: "seedance20-prompts-fr.json",
  de: "seedance20-prompts-de.json",
  it: "seedance20-prompts-it.json",
  pt: "seedance20-prompts-pt.json",
  ru: "seedance20-prompts-ru.json",
  ar: "seedance20-prompts-ar.json",
  hi: "seedance20-prompts-hi.json",
  th: "seedance20-prompts-th.json",
  vi: "seedance20-prompts-vi.json",
  id: "seedance20-prompts-id.json",
  tr: "seedance20-prompts-tr.json",
  nl: "seedance20-prompts-nl.json",
  pl: "seedance20-prompts-pl.json",
  sv: "seedance20-prompts-sv.json",
};

const localeToTwitterFile: Record<string, string> = {
  en: "seedance20-twitter-prompts-en.json",
  zh: "seedance20-twitter-prompts-zh-CN.json",
  "zh-TW": "seedance20-twitter-prompts-zh-TW.json",
  ja: "seedance20-twitter-prompts-ja.json",
  ko: "seedance20-twitter-prompts-ko.json",
  es: "seedance20-twitter-prompts-es.json",
  fr: "seedance20-twitter-prompts-fr.json",
  de: "seedance20-twitter-prompts-de.json",
  it: "seedance20-twitter-prompts-it.json",
  pt: "seedance20-twitter-prompts-pt.json",
  ru: "seedance20-twitter-prompts-ru.json",
  ar: "seedance20-twitter-prompts-ar.json",
  hi: "seedance20-twitter-prompts-hi.json",
  th: "seedance20-twitter-prompts-th.json",
  vi: "seedance20-twitter-prompts-vi.json",
  id: "seedance20-twitter-prompts-id.json",
  tr: "seedance20-twitter-prompts-tr.json",
  nl: "seedance20-twitter-prompts-nl.json",
  pl: "seedance20-twitter-prompts-pl.json",
  sv: "seedance20-twitter-prompts-sv.json",
};

const twitterCategoryMap: Record<string, string> = {
  tw_001: "advanced_cinematography",
  tw_003: "advanced_cinematography",
  tw_004: "creative_effects",
  tw_007: "narrative_extension",
  tw_008: "advanced_cinematography",
  tw_009: "advanced_cinematography",
  tw_016: "creative_effects",
  tw_018: "ultra_realistic",
  tw_021: "creative_effects",
  tw_022: "advanced_cinematography",
  tw_024: "advanced_cinematography",
};

async function readJson<T>(fileName: string): Promise<T> {
  const raw = await fs.readFile(path.join(sourceDataRoot, fileName), "utf8");
  return JSON.parse(raw) as T;
}

function buildLocalePrefix(locale: string): string {
  return locale === "en" ? "" : `/${locale}`;
}

function buildPromptLibraryUrl(locale: string): string {
  return `https://www.atlascloud.ai${buildLocalePrefix(locale)}/seedance-2-prompt`;
}

function buildPromptDetailUrl(locale: string, numericId: number): string {
  return `https://www.atlascloud.ai${buildLocalePrefix(locale)}/seedance-2-prompt/${numericId}`;
}

function buildModelUrl(locale: string): string {
  return `https://www.atlascloud.ai${buildLocalePrefix(locale)}/models/bytedance/seedance-2.0/text-to-video?ref=JPM683`;
}

async function main() {
  await fs.mkdir(promptsByLocaleRoot, { recursive: true });

  const englishOfficial = await readJson<OfficialLocaleData>(localeToOfficialFile.en);
  const twitterBase = await readJson<TwitterPromptBase[]>("seedance20-twitter-prompts.json");
  const officialVideoMap = await readJson<Record<string, string>>("seedance20-video-map.json");
  const twitterVideoMap = await readJson<Record<string, string>>("seedance20-twitter-video-map.json");

  const numericIdByPromptId = new Map<string, number>();
  let numericId = 1;

  for (const category of englishOfficial.categories) {
    for (const prompt of category.prompts) {
      numericIdByPromptId.set(prompt.id, numericId++);
    }
  }

  for (const prompt of twitterBase) {
    numericIdByPromptId.set(prompt.id, numericId++);
  }

  for (const lang of SUPPORTED_LANGUAGES) {
    const locale = lang.code;
    const officialData = await readJson<OfficialLocaleData>(localeToOfficialFile[locale]);
    const twitterTranslations = await readJson<TwitterLocalizedPrompt[]>(localeToTwitterFile[locale]);
    const twitterTranslationMap = new Map(twitterTranslations.map((prompt) => [prompt.id, prompt]));
    const localizedCategoryNameMap = new Map(officialData.categories.map((category) => [category.id, category.name]));
    const promptsByCategory = new Map<string, PromptRecord[]>();

    for (const category of officialData.categories) {
      promptsByCategory.set(category.id, []);
    }

    for (const category of officialData.categories) {
      const categoryBucket = promptsByCategory.get(category.id);
      if (!categoryBucket) continue;

      category.prompts.forEach((prompt, index) => {
        const promptNumericId = numericIdByPromptId.get(prompt.id);
        if (!promptNumericId) {
          throw new Error(`Missing numeric id for official prompt ${prompt.id}`);
        }

        categoryBucket.push({
          id: prompt.id,
          sort_order: promptNumericId,
          title: prompt.title,
          description: prompt.description,
          prompt: prompt.prompt,
          category: category.name,
          video_url: officialVideoMap[prompt.id],
          author_name: "AtlasCloud",
          source_platform: "official",
          source_link: buildPromptDetailUrl(locale, promptNumericId),
          language: locale,
          featured: index === 0,
          source_meta: {
            original_id: prompt.id,
            atlas_prompt_url: buildPromptDetailUrl(locale, promptNumericId),
            atlas_prompt_library_url: buildPromptLibraryUrl(locale),
            model_url: buildModelUrl(locale),
          },
        });
      });
    }

    for (const basePrompt of twitterBase) {
      const localized = twitterTranslationMap.get(basePrompt.id);
      const categoryId = twitterCategoryMap[basePrompt.id] || "ultra_realistic";
      const categoryBucket = promptsByCategory.get(categoryId);
      const promptNumericId = numericIdByPromptId.get(basePrompt.id);

      if (!categoryBucket) {
        throw new Error(`Missing category ${categoryId} for twitter prompt ${basePrompt.id}`);
      }

      if (!promptNumericId) {
        throw new Error(`Missing numeric id for twitter prompt ${basePrompt.id}`);
      }

      categoryBucket.push({
        id: basePrompt.id,
        sort_order: promptNumericId,
        title: localized?.title || basePrompt.title,
        description: localized?.description || basePrompt.description,
        prompt: localized?.prompt || basePrompt.prompt,
        category: localizedCategoryNameMap.get(categoryId) || categoryId,
        video_url: twitterVideoMap[basePrompt.id],
        author_name: basePrompt.author,
        source_platform: basePrompt.source,
        source_link: basePrompt.sourceUrl,
        language: locale,
        featured: false,
        source_meta: {
          original_id: basePrompt.id,
          atlas_prompt_url: buildPromptDetailUrl(locale, promptNumericId),
          atlas_prompt_library_url: buildPromptLibraryUrl(locale),
          model_url: buildModelUrl(locale),
        },
      });
    }

    const flattenedPrompts = officialData.categories.flatMap((category) => {
      const bucket = promptsByCategory.get(category.id) || [];
      return bucket.sort((a, b) => a.sort_order - b.sort_order);
    });

    await fs.writeFile(
      path.join(promptsByLocaleRoot, lang.localeFileName),
      JSON.stringify(flattenedPrompts, null, 2) + "\n",
      "utf8"
    );

    console.log(`Synced ${lang.localeFileName}: ${flattenedPrompts.length} prompts`);
  }

  const englishPromptsRaw = await fs.readFile(path.join(promptsByLocaleRoot, "en.json"), "utf8");
  await fs.writeFile(path.join(outputDataRoot, "prompts.json"), englishPromptsRaw, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
