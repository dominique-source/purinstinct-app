import { describe, it, expect } from "vitest";
import { TOKEN_RE, generateNfcToken, buildNfcUrl, parseNfcToken, resolvePlayerId } from "./nfc.js";

const BASE_URL = "https://purinstinct-app.vercel.app";
const ORIGIN = "https://purinstinct-app.vercel.app";

describe("generateNfcToken", () => {
  it("returns a 32-char lowercase hex string matching TOKEN_RE", () => {
    const token = generateNfcToken();
    expect(token).toMatch(TOKEN_RE);
  });

  it("returns a different token on each call", () => {
    expect(generateNfcToken()).not.toBe(generateNfcToken());
  });
});

describe("buildNfcUrl", () => {
  it("builds a deep link off the given baseUrl carrying the token as ?nfc=", () => {
    expect(buildNfcUrl("a".repeat(32), BASE_URL)).toBe(`${BASE_URL}/?nfc=${"a".repeat(32)}`);
  });
});

describe("parseNfcToken", () => {
  const token = "0123456789abcdef0123456789abcdef";

  it("extracts a valid token from a matching-origin URL", () => {
    expect(parseNfcToken(buildNfcUrl(token, BASE_URL), ORIGIN)).toBe(token);
  });

  it("rejects a URL on a different origin", () => {
    expect(parseNfcToken(`https://evil.example.com/?nfc=${token}`, ORIGIN)).toBeNull();
  });

  it("rejects a missing ?nfc= param", () => {
    expect(parseNfcToken(BASE_URL, ORIGIN)).toBeNull();
  });

  it("rejects a malformed token (wrong length/charset)", () => {
    expect(parseNfcToken(`${BASE_URL}/?nfc=not-a-token`, ORIGIN)).toBeNull();
  });

  it("rejects an unparseable string", () => {
    expect(parseNfcToken("not a url", ORIGIN)).toBeNull();
  });
});

describe("resolvePlayerId", () => {
  const token = "0123456789abcdef0123456789abcdef";

  it("resolves the playerId for an active tag", () => {
    const nfcTags = { [token]: { playerId: 7, assignedAt: 1000, active: true } };
    expect(resolvePlayerId(token, nfcTags)).toBe(7);
  });

  it("returns null for an inactive tag", () => {
    const nfcTags = { [token]: { playerId: 7, assignedAt: 1000, active: false } };
    expect(resolvePlayerId(token, nfcTags)).toBeNull();
  });

  it("returns null for an unknown token", () => {
    expect(resolvePlayerId(token, {})).toBeNull();
  });

  it("returns null when nfcTags is undefined", () => {
    expect(resolvePlayerId(token, undefined)).toBeNull();
  });
});
