import { describe, it, expect } from "vitest";
import { pairKey, joinOrCreateTeam, eligibleTeams, pickTeamMatchup, formTeamMatch } from "./teamMatch.js";

function team(name, memberIds) {
  return { name, memberIds };
}

describe("pairKey", () => {
  it("is order-independent", () => {
    expect(pairKey("a", "b")).toBe(pairKey("b", "a"));
  });
});

describe("joinOrCreateTeam", () => {
  it("creates a new team when no name matches", () => {
    const { teamId, isNew, name } = joinOrCreateTeam({}, "Marketing");
    expect(isNew).toBe(true);
    expect(name).toBe("Marketing");
    expect(teamId).toMatch(/^team_\d+$/);
  });

  it("joins an existing team by case/whitespace-insensitive name match", () => {
    const teams = { t1: team("Marketing", [1, 2]) };
    const { teamId, isNew } = joinOrCreateTeam(teams, "  marketing  ");
    expect(isNew).toBe(false);
    expect(teamId).toBe("t1");
  });

  it("does not confuse two different team names", () => {
    const teams = { t1: team("Marketing", [1]), t2: team("Ventes", [2]) };
    expect(joinOrCreateTeam(teams, "Ventes").teamId).toBe("t2");
  });
});

describe("eligibleTeams", () => {
  it("excludes teams below teamSize ready members", () => {
    const teams = { t1: team("A", [1, 2]), t2: team("B", [3, 4, 5]) };
    expect(eligibleTeams(teams, {}, 3)).toEqual(["t2"]);
  });

  it("excludes members already playing elsewhere from the ready count", () => {
    const teams = { t1: team("A", [1, 2, 3]) };
    const activeGames = { speed: { type: "sprint", participants: [1] } };
    // only 2 and 3 are ready -> below teamSize 3
    expect(eligibleTeams(teams, activeGames, 3)).toEqual([]);
  });
});

describe("pickTeamMatchup", () => {
  const teams = {
    t1: team("A", [1, 2, 3]),
    t2: team("B", [4, 5, 6]),
    t3: team("C", [7, 8, 9]),
  };

  it("returns null when fewer than 2 teams are eligible", () => {
    expect(pickTeamMatchup({ t1: team("A", [1]) }, {}, 3)).toBeNull();
  });

  it("picks the least-played pair first (equitable rotation)", () => {
    const pairCounts = {
      [pairKey("t1", "t2")]: 2,
      [pairKey("t1", "t3")]: 0,
      [pairKey("t2", "t3")]: 1,
    };
    const match = pickTeamMatchup(teams, {}, 3, pairCounts);
    expect([match.teamAId, match.teamBId].sort()).toEqual(["t1", "t3"]);
  });

  it("never picks the same pair twice in a row when a fresher pair is available", () => {
    let pairCounts = {};
    const seen = [];
    for (let i = 0; i < 3; i++) {
      const match = pickTeamMatchup(teams, {}, 3, pairCounts);
      const key = pairKey(match.teamAId, match.teamBId);
      seen.push(key);
      pairCounts = { ...pairCounts, [key]: (pairCounts[key] || 0) + 1 };
    }
    // With 3 teams and 3 rounds, all 3 distinct pairs should have been used once each.
    expect(new Set(seen).size).toBe(3);
  });
});

describe("formTeamMatch", () => {
  it("takes the first teamSize ready members of each team, in join order", () => {
    const teamA = team("A", [1, 2, 3, 4]);
    const teamB = team("B", [5, 6, 7]);
    const match = formTeamMatch(teamA, teamB, 2, {});
    expect(match).toEqual({ type: "team", teamA: [1, 2], teamB: [5, 6] });
  });

  it("skips members currently playing elsewhere", () => {
    const teamA = team("A", [1, 2, 3]);
    const teamB = team("B", [4, 5, 6]);
    const activeGames = { speed: { type: "sprint", participants: [1] } };
    const match = formTeamMatch(teamA, teamB, 2, activeGames);
    expect(match.teamA).toEqual([2, 3]);
    expect(match.teamB).toEqual([4, 5]);
  });
});
