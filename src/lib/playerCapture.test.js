import { describe, it, expect } from "vitest";
import { assertAllowedCapture } from "./playerCapture.js";

describe("assertAllowedCapture", () => {
  it("throws if an email is submitted in ecole mode (allowPII=false)", () => {
    expect(() =>
      assertAllowedCapture("ecole", { firstName: "Sam", email: "sam@example.com" }),
    ).toThrow(/interdit/);
  });

  it("throws on any PII field, not just email", () => {
    expect(() => assertAllowedCapture("ecole", { instagram: "@sam" })).toThrow();
    expect(() => assertAllowedCapture("ecole", { tiktok: "@sam" })).toThrow();
    expect(() => assertAllowedCapture("ecole", { snapchat: "sam" })).toThrow();
  });

  it("does not throw when no PII field is present in ecole mode", () => {
    expect(() => assertAllowedCapture("ecole", { firstName: "Sam", class: "5A" })).not.toThrow();
  });

  it("allows PII for modes where allowPII is true (games, corporate, festival, parc)", () => {
    for (const mode of ["games", "corporate", "festival", "parc"]) {
      expect(() => assertAllowedCapture(mode, { email: "sam@example.com" })).not.toThrow();
    }
  });

  it("is a no-op for an unknown mode key", () => {
    expect(() => assertAllowedCapture("unknown", { email: "sam@example.com" })).not.toThrow();
  });
});
