import { describe, it, expect } from "vitest";
import {
  shuffle, teamAvg, getStatus, makeEmptyGames, makeEmptyQueues,
  computeTeamResult, computeIndividualResult, refillQueues, buildInitialQueues,
} from "./game-logic.js";
import { ZK, ZONES, QUEUE_MIN } from "../config/zones.js";

function player(id, overrides = {}) {
  return {
    id, number: id, name: `P${id}`, gender: "M",
    globalPoints: 0, zoneScores: {}, zoneStreaks: {}, zonesPlayed: [],
    lastResult: null, history: [], groupId: "main",
    ...overrides,
  };
}

describe("shuffle", () => {
  it("returns an array with the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out.slice().sort()).toEqual(input.slice().sort());
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3];
    shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe("teamAvg", () => {
  it("defaults to 50 when the team is empty", () => {
    expect(teamAvg({}, [], "speed")).toBe(50);
    expect(teamAvg({}, null, "speed")).toBe(50);
  });

  it("defaults to 50 for players missing a zone score", () => {
    const pMap = { 1: player(1, { zoneScores: {} }) };
    expect(teamAvg(pMap, [1], "speed")).toBe(50);
  });

  it("averages zone scores across the team", () => {
    const pMap = {
      1: player(1, { zoneScores: { speed: 60 } }),
      2: player(2, { zoneScores: { speed: 40 } }),
    };
    expect(teamAvg(pMap, [1, 2], "speed")).toBe(50);
  });
});

describe("getStatus", () => {
  it("reports the zones a player is queued in and not playing", () => {
    const queues = { ...makeEmptyQueues(), speed: [1, 2], iq: [1] };
    const games = makeEmptyGames();
    const status = getStatus(1, queues, games);
    expect(status.inQueues.sort()).toEqual(["iq", "speed"]);
    expect(status.playingAt).toBeNull();
  });

  it("reports which zone a player is actively playing in (team game)", () => {
    const queues = makeEmptyQueues();
    const games = { ...makeEmptyGames(), purinstinct: { teamA: [1, 2], teamB: [3, 4] } };
    const status = getStatus(1, queues, games);
    expect(status.playingAt).toBe("purinstinct");
  });

  it("reports which zone a player is actively playing in (participants game)", () => {
    const queues = makeEmptyQueues();
    const games = { ...makeEmptyGames(), speed: { participants: [5, 6, 7] } };
    const status = getStatus(6, queues, games);
    expect(status.playingAt).toBe("speed");
  });
});

describe("computeTeamResult", () => {
  it("awards the zone's winPts to the winning team and deducts lossPts from the losing team", () => {
    const players = [player(1), player(2), player(3), player(4)];
    const result = computeTeamResult(players, [1, 2], [3, 4], "A", "purinstinct");
    const z = ZONES.purinstinct;
    expect(result.find(p => p.id === 1).globalPoints).toBe(z.winPts);
    expect(result.find(p => p.id === 2).globalPoints).toBe(z.winPts);
    expect(result.find(p => p.id === 3).globalPoints).toBe(0); // clamped at 0
    expect(result.find(p => p.id === 4).globalPoints).toBe(0);
  });

  it("leaves players outside both teams untouched", () => {
    const players = [player(1), player(2), player(3), player(4), player(5)];
    const result = computeTeamResult(players, [1, 2], [3, 4], "A", "purinstinct");
    expect(result.find(p => p.id === 5)).toEqual(players.find(p => p.id === 5));
  });

  it("gives a streak bonus after 2+ consecutive wins in the same zone", () => {
    const winner = player(1, { zoneStreaks: { speed: 2 }, zoneScores: { speed: 50 } });
    const players = [winner, player(2)];
    const result = computeTeamResult(players, [1], [2], "A", "speed");
    const z = ZONES.speed;
    // bonus applies: winPts * 1.5, rounded
    expect(result.find(p => p.id === 1).globalPoints).toBe(Math.round(z.winPts * 1.5));
    expect(result.find(p => p.id === 1).zoneStreaks.speed).toBe(3);
  });

  it("resets the streak to 0 on a loss", () => {
    const loser = player(2, { zoneStreaks: { speed: 4 } });
    const players = [player(1), loser];
    const result = computeTeamResult(players, [1], [2], "A", "speed");
    expect(result.find(p => p.id === 2).zoneStreaks.speed).toBe(0);
  });

  it("adjusts points for favored vs underdog teams (5+ point zone-score gap)", () => {
    const players = [
      player(1, { zoneScores: { handAgility: 80 } }), // favored, wins
      player(2, { zoneScores: { handAgility: 20 } }),
    ];
    const z = ZONES.handAgility;
    const result = computeTeamResult(players, [1], [2], "A", "handAgility");
    // favored winner: winPts - 1 (min 1)
    expect(result.find(p => p.id === 1).globalPoints).toBe(Math.max(1, z.winPts - 1));
    // underdog loser: lossPts - 1 (min 0)
    expect(result.find(p => p.id === 2).globalPoints).toBe(0);
  });
});

describe("computeIndividualResult", () => {
  it("awards winPts to the winner and lossPts to the rest of the participants", () => {
    const players = [player(1), player(2), player(3)];
    const result = computeIndividualResult(players, [1, 2, 3], 1, "iq");
    const z = ZONES.iq;
    expect(result.find(p => p.id === 1).globalPoints).toBe(z.winPts);
    expect(result.find(p => p.id === 2).globalPoints).toBe(0);
    expect(result.find(p => p.id === 3).globalPoints).toBe(0);
  });

  it("gives the speed second-place finisher a flat +2 global points", () => {
    const players = [player(1), player(2), player(3)];
    const result = computeIndividualResult(players, [1, 2, 3], 1, "speed", 2);
    expect(result.find(p => p.id === 2).globalPoints).toBe(2);
    expect(result.find(p => p.id === 2).lastResult.isSecond).toBe(true);
  });

  it("applies a sprint tier adjustment for speed zone results", () => {
    // tier 5 (score 100 -> worst tier) winner gets +1 extra point
    const winner = player(1, { zoneScores: { speed: 100 } });
    const loser = player(2, { zoneScores: { speed: 50 } });
    const z = ZONES.speed;
    const result = computeIndividualResult([winner, loser], [1, 2], 1, "speed");
    expect(result.find(p => p.id === 1).globalPoints).toBe(z.winPts + 1);
  });
});

describe("refillQueues", () => {
  it("tops up a zone queue up to its configured minimum", () => {
    const players = Array.from({ length: 20 }, (_, i) => player(i + 1));
    const queues = makeEmptyQueues();
    const games = makeEmptyGames();
    const result = refillQueues(players, queues, games);
    expect(result.speed.length).toBeGreaterThanOrEqual(
      Math.min(QUEUE_MIN.speed, players.length)
    );
  });

  it("does not add a player already in the same zone's queue", () => {
    const players = Array.from({ length: 20 }, (_, i) => player(i + 1));
    const queues = { ...makeEmptyQueues(), speed: [1, 2, 3] };
    const games = makeEmptyGames();
    const result = refillQueues(players, queues, games);
    const occurrences = result.speed.filter(id => id === 1).length;
    expect(occurrences).toBe(1);
  });

  it("does not queue a player who is currently playing", () => {
    const players = Array.from({ length: 20 }, (_, i) => player(i + 1));
    const queues = makeEmptyQueues();
    const games = { ...makeEmptyGames(), purinstinct: { teamA: [1], teamB: [2] } };
    const result = refillQueues(players, queues, games);
    ZK.forEach(zone => {
      if (zone !== "purinstinct") expect(result[zone]).not.toContain(1);
    });
  });
});

describe("buildInitialQueues", () => {
  it("caps each player at at most 2 zone assignments", () => {
    const players = Array.from({ length: 10 }, (_, i) => player(i + 1));
    const q = buildInitialQueues(players);
    const counts = {};
    ZK.forEach(zone => q[zone].forEach(id => { counts[id] = (counts[id] || 0) + 1; }));
    Object.values(counts).forEach(c => expect(c).toBeLessThanOrEqual(2));
  });

  it("only queues known player ids", () => {
    const players = [player(1), player(2)];
    const q = buildInitialQueues(players);
    ZK.forEach(zone => q[zone].forEach(id => expect([1, 2]).toContain(id)));
  });
});
