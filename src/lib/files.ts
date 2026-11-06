export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type BillMime = "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "application/pdf";

export const ACCEPTED_BILL_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

export function detectBillMime(bytes: Uint8Array): BillMime | null {
  if (bytes.length < 12) return null;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  if (ascii(bytes, 0, 5) === "%PDF-") return "application/pdf";
  if (ascii(bytes, 4, 8) === "ftyp" && ["heic", "heix", "mif1", "msf1", "heif"].includes(ascii(bytes, 8, 12))) {
    return "image/heic";
  }
  return null;
}

export type FileCheck = { ok: true; mime: BillMime } | { ok: false; error: string };

export function checkBillFile(bytes: Uint8Array): FileCheck {
  if (bytes.length === 0) return { ok: false, error: "Please choose a photo or PDF of your bill." };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, error: "That file is larger than 4 MB. Please take a new photo or upload a smaller PDF." };
  const mime = detectBillMime(bytes);
  if (!mime) return { ok: false, error: "Please upload a photo (JPG, PNG, WebP, HEIC) or a PDF of your bill." };
  return { ok: true, mime };
}
