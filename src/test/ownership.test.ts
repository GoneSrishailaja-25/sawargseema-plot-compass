import { describe, expect, it } from "vitest";
import { adminReviewSchema, reviewSchema, verificationProgress, validateOwnershipFile } from "@/lib/ownership";

describe("Ownership verification", () => {
  it("never counts Pending uploads as Verified", () => {
    expect(verificationProgress([{ category: "ownership", status: "Pending" }, { category: "sale_deed", status: "Pending" }, { category: "approval", status: "Pending" }])).toEqual({ verified: 0, total: 3, percent: 0, missing: [] });
  });
  it("reports missing required records", () => expect(verificationProgress([{ category: "ownership", status: "Verified" }]).missing).toEqual(["sale_deed", "approval"]));
  it("counts reviewed categories once and excludes rejected records", () => expect(verificationProgress([{ category: "ownership", status: "Verified" }, { category: "ownership", status: "Verified" }, { category: "sale_deed", status: "Rejected" }]).verified).toBe(1));
  it("accepts only Pending, Verified and Rejected review states", () => {
    for (const status of ["Pending", "Verified", "Rejected"]) expect(reviewSchema.safeParse({ document: "00000000-0000-4000-8000-000000000001", status, note: "Officer reviewed" }).success).toBe(true);
    expect(reviewSchema.safeParse({ document: "00000000-0000-4000-8000-000000000001", status: "Approved", note: "" }).success).toBe(false);
  });
  it("requires rejection reason", () => expect(reviewSchema.safeParse({ document: "00000000-0000-4000-8000-000000000001", status: "Rejected", note: " " }).success).toBe(false));
  it("requires an admin approval reason", () => {
    const review = { document: "00000000-0000-4000-8000-000000000001", status: "Verified", note: " " };
    expect(adminReviewSchema.safeParse(review).success).toBe(false);
    expect(adminReviewSchema.safeParse({ ...review, note: "Ownership confirmed against sale deed" }).success).toBe(true);
  });
  it("requires an admin rejection reason", () => expect(adminReviewSchema.safeParse({ document: "00000000-0000-4000-8000-000000000001", status: "Rejected", note: " " }).success).toBe(false));
  it("updates progress only for explicitly verified categories", () => {
    expect(verificationProgress([{ category: "ownership", status: "Pending" }]).percent).toBe(0);
    expect(verificationProgress([{ category: "ownership", status: "Verified" }]).percent).toBe(33);
    expect(verificationProgress([{ category: "ownership", status: "Rejected" }]).percent).toBe(0);
  });
  it("accepts a PDF and rejects executable or oversized uploads", () => {
    expect(() => validateOwnershipFile({ name: "deed.pdf", size: 100, type: "application/pdf" })).not.toThrow();
    expect(() => validateOwnershipFile({ name: "file.exe", size: 100, type: "application/octet-stream" })).toThrow();
    expect(() => validateOwnershipFile({ name: "deed.pdf", size: 10485761, type: "application/pdf" })).toThrow();
  });
});