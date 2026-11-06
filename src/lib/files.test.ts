import { describe, expect, it } from "vitest";
import { checkBillFile, detectBillMime, MAX_UPLOAD_BYTES } from "./files";
import { inServiceArea, regionForPincode } from "./service-area";

const bytes = (head: number[] | string, size = 64) => {
  const h = typeof head === "string" ? [...head].map((c) => c.charCodeAt(0)) : head;
  const b = new Uint8Array(Math.max(size, h.length));
  b.set(h);
  return b;
};

describe("detectBillMime (checks real file contents, not the extension)", () => {
  it.each([
    ["JPEG", [0xff, 0xd8, 0xff, 0xe0], "image/jpeg"],
    ["PNG", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png"],
    ["WebP", "RIFF\0\0\0\0WEBP", "image/webp"],
    ["PDF", "%PDF-1.7", "application/pdf"],
    ["HEIC", "\0\0\0\x18ftypheic", "image/heic"],
  ] as const)("recognises %s", (_, head, mime) => {
    expect(detectBillMime(bytes(head as number[] | string))).toBe(mime);
  });

  it("rejects other files, even if renamed to .jpg", () => {
    expect(detectBillMime(bytes("<html><script>"))).toBeNull();
    expect(detectBillMime(bytes("MZ\x90\0"))).toBeNull();
    expect(detectBillMime(bytes("GIF89a"))).toBeNull();
  });

  it("rejects files too short to identify", () => {
    expect(detectBillMime(new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
  });
});

describe("checkBillFile", () => {
  it("rejects empty and oversized files with a clear message", () => {
    expect(checkBillFile(new Uint8Array())).toMatchObject({ ok: false, error: expect.stringMatching(/choose/) });
    expect(checkBillFile(bytes([0xff, 0xd8, 0xff], MAX_UPLOAD_BYTES + 1))).toMatchObject({ ok: false, error: expect.stringMatching(/4 MB/) });
  });

  it("accepts a valid photo", () => {
    expect(checkBillFile(bytes([0xff, 0xd8, 0xff]))).toEqual({ ok: true, mime: "image/jpeg" });
  });
});

describe("service area (Vidarbha pincodes)", () => {
  it("knows Vidarbha regions", () => {
    expect(regionForPincode("440022")).toBe("Nagpur");
    expect(regionForPincode("445001")).toBe("Yavatmal");
  });

  it("returns null outside Vidarbha or for bad input", () => {
    expect(regionForPincode("411001")).toBeNull();
    expect(regionForPincode("4400")).toBeNull();
    expect(inServiceArea("560001")).toBe(false);
  });
});
