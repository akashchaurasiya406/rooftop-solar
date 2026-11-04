import { beforeAll, describe, expect, it } from "vitest";
import { canAccess, signSession, verifySession } from "./session";
import { safeNext, signupSchema } from "./validation";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-that-is-at-least-32-characters-long";
});

describe("canAccess (role-based access control)", () => {
  it("lets anyone open public pages", () => {
    expect(canAccess("/", null)).toBe(true);
    expect(canAccess("/login", null)).toBe(true);
  });

  it("blocks signed-out users from protected areas", () => {
    expect(canAccess("/sales", null)).toBe(false);
    expect(canAccess("/my", null)).toBe(false);
  });

  it("keeps homeowners out of sales and admin", () => {
    expect(canAccess("/sales", "HOMEOWNER")).toBe(false);
    expect(canAccess("/sales/leads/123", "HOMEOWNER")).toBe(false);
    expect(canAccess("/admin/subsidy", "HOMEOWNER")).toBe(false);
  });

  it("keeps sales out of admin and homeowner pages", () => {
    expect(canAccess("/sales", "SALES")).toBe(true);
    expect(canAccess("/admin", "SALES")).toBe(false);
    expect(canAccess("/my", "SALES")).toBe(false);
  });

  it("lets admins into sales and admin", () => {
    expect(canAccess("/sales", "ADMIN")).toBe(true);
    expect(canAccess("/admin/prices", "ADMIN")).toBe(true);
  });

  it("does not treat look-alike paths as protected areas", () => {
    expect(canAccess("/salesy", null)).toBe(true);
  });
});

describe("sessions", () => {
  it("round-trips a valid session", async () => {
    const token = await signSession({ userId: "u1", role: "SALES", name: "Kunal" });
    expect(await verifySession(token)).toEqual({ userId: "u1", role: "SALES", name: "Kunal" });
  });

  it("rejects a tampered token (e.g. role changed to ADMIN)", async () => {
    const token = await signSession({ userId: "u1", role: "HOMEOWNER", name: "A" });
    const [h, , s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "u1", role: "ADMIN", name: "A" })).toString("base64url");
    expect(await verifySession(`${h}.${forged}.${s}`)).toBeNull();
  });

  it("rejects missing and garbage tokens", async () => {
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("not-a-jwt")).toBeNull();
  });
});

describe("safeNext (open-redirect protection)", () => {
  it("allows our own paths", () => {
    expect(safeNext("/sales?f=HIGH")).toBe("/sales?f=HIGH");
  });
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", 42, null])(
    "blocks %s",
    (v) => expect(safeNext(v)).toBeNull(),
  );
});

describe("signupSchema", () => {
  const ok = { name: "Asha Patil", email: "ASHA@Example.com ", phone: "+91 98765 43210", password: "sunny2026" };

  it("normalises email and phone", () => {
    const r = signupSchema.parse(ok);
    expect(r.email).toBe("asha@example.com");
    expect(r.phone).toBe("9876543210");
  });

  it("rejects invalid mobile numbers", () => {
    expect(signupSchema.safeParse({ ...ok, phone: "12345" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...ok, phone: "5876543210" }).success).toBe(false);
  });

  it("rejects weak passwords", () => {
    expect(signupSchema.safeParse({ ...ok, password: "short1" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...ok, password: "onlyletters" }).success).toBe(false);
  });
});
