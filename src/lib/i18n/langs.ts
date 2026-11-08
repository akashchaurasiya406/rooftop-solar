export type Lang = "en" | "hi" | "mr";
export const LANGS: Lang[] = ["en", "hi", "mr"];
export const LANG_LABEL: Record<Lang, string> = { en: "EN", hi: "हिं", mr: "मरा" };
export const isLang = (v: unknown): v is Lang => v === "en" || v === "hi" || v === "mr";
export const usesDevanagari = (l: Lang) => l !== "en";
