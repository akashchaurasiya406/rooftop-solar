import "server-only";
import { cookies } from "next/headers";
import { en, type Dict } from "./en";
import { hi } from "./hi";
import { isLang, type Lang } from "./langs";
import { mr } from "./mr";

export { isLang, LANGS, type Lang } from "./langs";
export const LANG_COOKIE = "lang";

const DICTS: Record<Lang, Dict> = { en, hi, mr };

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "en";
}

export async function getDict(): Promise<{ lang: Lang; t: Dict }> {
  const lang = await getLang();
  return { lang, t: DICTS[lang] };
}

export const dictFor = (lang: Lang): Dict => DICTS[lang];

export const dateLocale = (lang: Lang) => (lang === "en" ? "en-IN" : `${lang}-IN`);

export type { Dict };
