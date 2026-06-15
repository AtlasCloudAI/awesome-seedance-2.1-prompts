import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface PromptRecord {
  id: string;
  sort_order: number;
  title: string;
  description: string;
  prompt: string;
  category: string;
  video_url?: string;
  author_name: string;
  author_link?: string;
  source_platform: string;
  source_link?: string;
  language: string;
  featured?: boolean;
  source_meta?: {
    original_id: string;
    atlas_prompt_url?: string;
    atlas_prompt_library_url?: string;
    model_url?: string;
  };
}

export interface SortedPromptData {
  all: PromptRecord[];
  featured: PromptRecord[];
  categoryCounts: Array<{ category: string; count: number }>;
  stats: {
    total: number;
    featured: number;
    videos: number;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");
const promptsByLocaleDir = path.join(root, "data", "prompts_by_locale");

export async function loadLocalePrompts(localeFile: string): Promise<PromptRecord[]> {
  const raw = await fs.readFile(path.join(promptsByLocaleDir, localeFile), "utf8");
  const prompts = JSON.parse(raw) as PromptRecord[];
  return prompts.sort((a, b) => a.sort_order - b.sort_order);
}

export function sortPrompts(prompts: PromptRecord[]): SortedPromptData {
  const all = [...prompts].sort((a, b) => a.sort_order - b.sort_order);
  const featured = all.filter((prompt) => prompt.featured).slice(0, 8);
  const categoryMap = new Map<string, number>();

  for (const prompt of all) {
    categoryMap.set(prompt.category, (categoryMap.get(prompt.category) || 0) + 1);
  }

  return {
    all,
    featured,
    categoryCounts: [...categoryMap.entries()].map(([category, count]) => ({ category, count })),
    stats: {
      total: all.length,
      featured: featured.length,
      videos: all.filter((prompt) => Boolean(prompt.video_url)).length,
    },
  };
}
