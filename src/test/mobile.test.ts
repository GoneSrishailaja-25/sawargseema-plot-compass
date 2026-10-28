import { describe, expect, it } from "vitest";
import { MOBILE_RE, normalizeMobile } from "@/lib/data";

describe("normalizeMobile", () => {
  it("keeps a plain 10-digit number", () => expect(normalizeMobile("9876543210")).toBe("9876543210"));
  it("strips +91 with spaces", () => expect(normalizeMobile("+91 98765 43210")).toBe("9876543210"));
  it("strips 91 without plus", () => expect(normalizeMobile("919876543210")).toBe("9876543210"));
  it("strips leading 0", () => expect(normalizeMobile("09876543210")).toBe("9876543210"));
  it("valid numbers pass after normalizing", () => expect(MOBILE_RE.test(normalizeMobile("+91-98765-43210"))).toBe(true));
  it("rejects numbers starting with 1-5", () => expect(MOBILE_RE.test(normalizeMobile("5876543210"))).toBe(false));
});
