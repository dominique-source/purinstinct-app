import { describe, it, expect } from "vitest";
import { MODES, resolveMode, classifyModeRoute } from "./modes.js";

describe("MODES", () => {
  it("defines the 6 public modes plus a hidden admin mode", () => {
    expect(Object.keys(MODES).sort()).toEqual(
      ["admin", "corporate", "ecole", "festival", "games", "parc", "petitGroupe"].sort(),
    );
  });

  it("admin mode is hidden and unlocks the union of every view", () => {
    expect(MODES.admin.hidden).toBe(true);
    for (const key of ["games", "corporate", "ecole", "festival", "parc", "petitGroupe"]) {
      for (const view of MODES[key].enabledViews) {
        expect(MODES.admin.enabledViews).toContain(view);
      }
    }
  });

  it("petitGroupe mode does not default to kiosk (the entry code routes to the admin dashboard instead)", () => {
    expect(MODES.petitGroupe.kioskDefault).toBe(false);
    expect(MODES.petitGroupe.enabledViews).toContain("smallGroupAdmin");
    expect(MODES.petitGroupe.enabledViews).toContain("kiosk");
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
    // petitGroupe EN SOURDINE (config/modes.js: MODE_CODES.petitGroupe
    // commenté) — "0005" ne résout plus rien tant que ça reste le cas.
    // Remettre `expect(resolveMode("0005")).toBe("petitGroupe");` en
    // réactivant l'entrée.
    expect(resolveMode("0005")).toBeNull();
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

// Smoke test de bascule de mode: pour chacun des 6 codes d'entrée, vérifie
// le trajet complet code → resolveMode → classifyModeRoute que le
// dispatcher de App.jsx (onSelectMode) suit réellement. Toute dérive entre
// modes.js et App.jsx (ex. un nouveau mode oublié dans un des deux) fait
// échouer ce test.
describe("mode switching (smoke test)", () => {
  const EXPECTED = {
    "0000": { mode: "games", route: "live" },
    "0001": { mode: "corporate", route: "kiosk" },
    "0002": { mode: "ecole", route: "kiosk" },
    "0003": { mode: "festival", route: "kiosk" },
    "0004": { mode: "parc", route: "kiosk" },
    // "0005" (petitGroupe) omis: EN SOURDINE, voir config/modes.js —
    // remettre `"0005": { mode: "petitGroupe", route: "smallGroupAdmin" },`
    // en réactivant l'entrée.
    "1111": { mode: "admin", route: "admin" },
  };

  it("routes every entry code to its expected mode and destination", () => {
    for (const [code, expected] of Object.entries(EXPECTED)) {
      const modeKey = resolveMode(code);
      expect(modeKey, `resolveMode("${code}")`).toBe(expected.mode);
      expect(classifyModeRoute(modeKey), `classifyModeRoute("${modeKey}")`).toBe(expected.route);
    }
  });

  it("games (reference/RFID) always routes to the live flow, never kiosk or stub", () => {
    expect(classifyModeRoute(resolveMode("0000"))).toBe("live");
  });

  it("an unknown code never resolves to a route", () => {
    expect(classifyModeRoute(resolveMode("9999"))).toBeNull();
  });

  // EN SOURDINE — voir config/modes.js (MODE_CODES.petitGroupe commenté).
  // Ce test valide le comportement du code d'entrée réactivé; il redevient
  // pertinent dès que cette entrée est décommentée.
  it.skip("petitGroupe routes to its own distinct destination, not kiosk/admin/live/stub", () => {
    const route = classifyModeRoute(resolveMode("0005"));
    expect(route).toBe("smallGroupAdmin");
    expect(["kiosk", "admin", "live", "stub", null]).not.toContain(route);
  });
});
