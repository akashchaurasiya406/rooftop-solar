export type ReasonCode =
  | "TENANT"
  | "OUTSIDE_AREA"
  | "SMALL_BILL"
  | "HIGH_BILL"
  | "MODERATE_BILL"
  | "ROOF_TOO_SMALL"
  | "ROOF_LIMIT"
  | "LOAD_LIMIT"
  | "ROOF_FITS"
  | "ASBESTOS"
  | "CONCRETE"
  | "OWNER";

export interface Reason {
  code: ReasonCode;
  p?: Record<string, string | number>;
}

export type ReasonTemplates = Record<ReasonCode, string>;

export function formatReason(templates: ReasonTemplates, r: Reason | string): string {
  if (typeof r === "string") return r;
  const tpl = templates[r.code] ?? r.code;
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = r.p?.[k];
    if (v === undefined) return "";
    return k === "bill" ? `₹${Number(v).toLocaleString("en-IN")}` : String(v);
  });
}

export function parseReasons(json: unknown): (Reason | string)[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is Reason | string => typeof x === "string" || (typeof x === "object" && x !== null && "code" in x));
}
