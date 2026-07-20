import { describe, it, expect } from "vitest";
import { MODES, resolveMode } from "./modes.js";

describe("MODES", () => {
  it("defines the 5 public modes plus a hidden admin mode", () => {
    expect(Object.keys(MODES).sort()).toEqual(
      ["admin", "corporate", "ecole", "festival", "games", "parc"].sort(),
    );
  });

  it("admin mode is hidden and unlocks the union of every view", () => {
    expect(MODES.admin.hidden).toBe(true);
    for (const key of ["games", "corporate", "ecole", "festival", "parc"]) {
      for (const view of MODES[key].enabledViews) {
        expect(MODES.admin.enabledViews).toContain(view);
      }
    }
  });

  it("games mode matches the reference/RFID config (no regression)", () => {
    expect(MODES.games).toMatchObject({
      entryFlow: "rfid",
      captureFields: ["name", "number"],
      consent: "photo",
      allowPII: true,
      kioskDefault: false,
    });
  });

  it("ecole mode disallows PII", () => {
    expect(MODES.ecole.allowPII).toBe(false);
  });

  it("festival and parc default straight to kiosk", () => {
    expect(MODES.festival.kioskDefault).toBe(true);
    expect(MODES.parc.kioskDefault).toBe(true);
  });
});

describe("resolveMode", () => {
  it("resolves a valid mode code to its mode key", () => {
    expect(resolveMode("0000")).toBe("games");
    expect(resolveMode("0001")).toBe("corporate");
    expect(resolveMode("0002")).toBe("ecole");
    expect(resolveMode("0003")).toBe("festival");
    expect(resolveMode("0004")).toBe("parc");
  });

  it("resolves the admin PIN to the admin mode", () => {
    expect(resolveMode("1111")).toBe("admin");
  });

  it("returns null for an unknown code", () => {
    expect(resolveMode("9999")).toBeNull();
    expect(resolveMode("zzzz")).toBeNull();
  });

  it("returns null for empty/missing input", () => {
    expect(resolveMode("")).toBeNull();
    expect(resolveMode(null)).toBeNull();
    expect(resolveMode(undefined)).toBeNull();
  });
});
