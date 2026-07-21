import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Mini-simulateur des règles Firebase (database.rules.json): il n'y a pas
// d'émulateur Firebase installé dans ce projet (pas de firebase-tools/JVM),
// donc on évalue directement les expressions ".validate" du fichier de
// règles réel — pas une réécriture qui pourrait dériver du fichier.
const rulesPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../database.rules.json",
);
const RULES = JSON.parse(readFileSync(rulesPath, "utf-8"));

function makeRef(data) {
  const value = data === undefined ? null : data;
  return {
    val: () => value,
    child: (childPath) => {
      let cur = data;
      for (const part of childPath.split("/")) cur = cur?.[part];
      return makeRef(cur);
    },
    // Sous-ensemble des méthodes natives de validation Firebase RTDB
    // utilisées dans database.rules.json — étendre au besoin si de
    // nouvelles règles en utilisent d'autres (isBoolean, exists, ...).
    isString: () => typeof value === "string",
    isNumber: () => typeof value === "number",
    isBoolean: () => typeof value === "boolean",
    exists: () => value !== null,
  };
}

// Évalue littéralement l'expression ".validate" trouvée dans database.rules.json.
function evalValidate(expr, { rootData, newDataValue }) {
  const root = makeRef(rootData);
  const newData = makeRef(newDataValue);
  const fn = new Function("root", "newData", `return (${expr});`);
  return fn(root, newData);
}

const emailValidateExpr = RULES.rules.state.players.$playerId.email[".validate"];

describe("database.rules.json — verrou PII en mode ecole", () => {
  it("rejette un email non vide quand activationMode=ecole", () => {
    const allowed = evalValidate(emailValidateExpr, {
      rootData: { state: { activationMode: "ecole" } },
      newDataValue: "sam@example.com",
    });
    expect(allowed).toBe(false);
  });

  it("autorise un email vide (valeur par défaut) même en mode ecole", () => {
    const allowed = evalValidate(emailValidateExpr, {
      rootData: { state: { activationMode: "ecole" } },
      newDataValue: "",
    });
    expect(allowed).toBe(true);
  });

  it("autorise un email non vide pour les autres modes (zéro régression games/festival/corporate/parc)", () => {
    for (const mode of ["games", "corporate", "festival", "parc", "admin", null]) {
      const allowed = evalValidate(emailValidateExpr, {
        rootData: { state: { activationMode: mode } },
        newDataValue: "sam@example.com",
      });
      expect(allowed).toBe(true);
    }
  });

  it("applique la même règle aux autres champs de contact (instagram/tiktok/snapchat)", () => {
    for (const field of ["instagram", "tiktok", "snapchat"]) {
      const expr = RULES.rules.state.players.$playerId[field][".validate"];
      expect(
        evalValidate(expr, { rootData: { state: { activationMode: "ecole" } }, newDataValue: "@sam" }),
      ).toBe(false);
    }
  });
});

describe("database.rules.json — mode équipes manuel (teams/teamPairCounts)", () => {
  const nameExpr = RULES.rules.state.teams.$zone.$teamId.name[".validate"];
  const memberIdExpr = RULES.rules.state.teams.$zone.$teamId.memberIds.$index[".validate"];
  const pairCountExpr = RULES.rules.state.teamPairCounts.$zone.$pairKey[".validate"];

  it("accepte un nom d'équipe qui est une chaîne", () => {
    expect(evalValidate(nameExpr, { rootData: {}, newDataValue: "Marketing" })).toBe(true);
  });

  it("rejette un nom d'équipe qui n'est pas une chaîne", () => {
    expect(evalValidate(nameExpr, { rootData: {}, newDataValue: 123 })).toBe(false);
  });

  it("accepte un memberId numérique", () => {
    expect(evalValidate(memberIdExpr, { rootData: {}, newDataValue: 27 })).toBe(true);
  });

  it("rejette un memberId non numérique", () => {
    expect(evalValidate(memberIdExpr, { rootData: {}, newDataValue: "27" })).toBe(false);
  });

  it("accepte un compte de paire numérique", () => {
    expect(evalValidate(pairCountExpr, { rootData: {}, newDataValue: 2 })).toBe(true);
  });

  it("rejette un compte de paire non numérique", () => {
    expect(evalValidate(pairCountExpr, { rootData: {}, newDataValue: "2" })).toBe(false);
  });
});
