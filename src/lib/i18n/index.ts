import "server-only";
import { cookies } from "next/headers";
import { en, type Dict } from "./en";
import { hi } from "./hi";

export type Lang = "en" | "hi";
export const LANG_COOKIE = "lang";
export const LANGS: Lang[] = ["en", "hi"];

const DICTS: Record<Lang, Dict> = { en, hi };

export const isLang = (v: unknown): v is Lang => v === "en" || v === "hi";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "en";
}

export async function getDict(): Promise<{ lang: Lang; t: Dict }> {
  const lang = await getLang();
  return { lang, t: DICTS[lang] };
}

export const dictFor = (lang: Lang): Dict => DICTS[lang];

export const dateLocale = (lang: Lang) => (lang === "hi" ? "hi-IN" : "en-IN");

export type { Dict };
