import { describe, it, expect } from "vitest";
import {
  SECONDARY_ZONE_CANDIDATES,
  selectPurinstinctPlayers,
  pickSecondaryZones,
  distributeSecondaryZones,
  formSpeedRace,
  planRound,
} from "./smallGroup.js";

function player(id, overrides = {}) {
  return {
    id, globalPoints: 0, zoneScores: {}, zonesPlayed: [], history: [],
    ...overrides,
  };
}

describe("selectPurinstinctPlayers", () => {
  it("prioritizes players who have never played purinstinct", () => {
    const pMap = {
      1: player(1, { zonesPlayed: ["purinstinct"] }),
      2: player(2, { zonesPlayed: [] }),
      3: player(3, { zonesPlayed: ["purinstinct"] }),
      4: player(4, { zonesPlayed: [] }),
    };
    const { selected } = selectPurinstinctPlayers([1, 2, 3, 4], pMap, 2);
    expect(selected.sort()).toEqual([2, 4]);
  });

  it("among never-played players, order is stable (no crash, deterministic count)", () => {
    const pMap = { 1: player(1), 2: player(2), 3: player(3) };
    const { selected, remaining } = selectPurinstinctPlayers([1, 2, 3], pMap, 2);
    expect(selected.length).toBe(2);
    expect(remaining.length).toBe(1);
  });

  it("among players who have played purinstinct, picks the oldest last-played first", () => {
    const pMap = {
      1: player(1, { zonesPlayed: ["purinstinct"], history: [{ zone: "purinstinct", ts: 1000 }] }),
      2: player(2, { zonesPlayed: ["purinstinct"], history: [{ zone: "purinstinct", ts: 500 }] }),
      3: player(3, { zonesPlayed: ["purinstinct"], history: [{ zone: "purinstinct", ts: 2000 }] }),
    };
    const { selected } = selectPurinstinctPlayers([1, 2, 3], pMap, 2);
    expect(selected).toEqual([2, 1]);
  });

  it("returns remaining as everyone not selected", () => {
    const pMap = { 1: player(1), 2: player(2), 3: player(3), 4: player(4) };
    const { selected, remaining } = selectPurinstinctPlayers([1, 2, 3, 4], pMap, 12);
    expect(selected.length).toBe(4);
    expect(remaining).toEqual([]);
  });
});

describe("pickSecondaryZones", () => {
  it("picks the least-used zones first", () => {
    const usage = { handAgility: 3, footAgility: 0, generalAgility: 1, iq: 2 };
    expect(pickSecondaryZones(SECONDARY_ZONE_CANDIDATES, 2, usage)).toEqual(["footAgility", "generalAgility"]);
  });

  it("breaks ties by candidate order", () => {
    const usage = {};
    expect(pickSecondaryZones(SECONDARY_ZONE_CANDIDATES, 2, usage)).toEqual(["handAgility", "footAgility"]);
  });

  it("caps at the number of available candidates", () => {
    expect(pickSecondaryZones(SECONDARY_ZONE_CANDIDATES, 10, {})).toHaveLength(4);
  });
});

describe("distributeSecondaryZones", () => {
  it("distributes players round-robin across the given zones", () => {
    const pMap = { 1: player(1), 2: player(2), 3: player(3), 4: player(4) };
    const result = distributeSecondaryZones([1, 2, 3, 4], ["handAgility", "iq"], pMap);
    expect(result.handAgility).toEqual([1, 3]);
    expect(result.iq).toEqual([2, 4]);
  });

  it("returns empty assignments for an empty zone list", () => {
    expect(distributeSecondaryZones([1, 2], [], {})).toEqual({});
  });

  it("swaps a player away from the zone they just played, when a valid swap exists", () => {
    // Round-robin would put player 1 (last played handAgility) into handAgility again.
    // Player 2 (last played iq) goes to iq via round-robin — a valid swap partner.
    const pMap = {
      1: player(1, { history: [{ zone: "handAgility", ts: 100 }] }),
      2: player(2, { history: [{ zone: "iq", ts: 100 }] }),
    };
    const result = distributeSecondaryZones([1, 2], ["handAgility", "iq"], pMap);
    expect(result.handAgility).toEqual([2]);
    expect(result.iq).toEqual([1]);
  });

  it("leaves assignment as-is when no valid swap exists", () => {
    // Both players just played the zone round-robin would assign them to —
    // no swap can improve things, so the round-robin assignment stands.
    const pMap = {
      1: player(1, { history: [{ zone: "handAgility", ts: 100 }] }),
      2: player(2, { history: [{ zone: "iq", ts: 100 }] }),
    };
    const result = distributeSecondaryZones([1], ["handAgility"], pMap);
    expect(result.handAgility).toEqual([1]);
  });
});

describe("formSpeedRace", () => {
  it("sorts participants by speed zoneScore ascending", () => {
    const pMap = {
      1: player(1, { zoneScores: { speed: 80 } }),
      2: player(2, { zoneScores: { speed: 20 } }),
      3: player(3, { zoneScores: { speed: 50 } }),
    };
    expect(formSpeedRace([1, 2, 3], pMap)).toEqual([2, 3, 1]);
  });
});

describe("planRound", () => {
  function makePlayers(n) {
    const pMap = {};
    for (let i = 1; i <= n; i++) pMap[i] = player(i, { globalPoints: i });
    return pMap;
  }

  it("splits 12 purinstinct players into two teams of 6", () => {
    const pMap = makePlayers(20);
    const result = planRound({
      availableIds: Object.keys(pMap).map(Number),
      pMap, zoneCount: 2, speedMode: false, secondaryZoneUsage: {},
    });
    expect(result.purinstinct.teamA.length + result.purinstinct.teamB.length).toBe(12);
  });

  it("distributes remaining players into the requested number of secondary zones", () => {
    const pMap = makePlayers(24);
    const result = planRound({
      availableIds: Object.keys(pMap).map(Number),
      pMap, zoneCount: 3, speedMode: false, secondaryZoneUsage: {},
    });
    expect(result.secondaryZones).toHaveLength(3);
    const assignedCount = Object.values(result.secondaryAssignments).flat().length;
    expect(assignedCount).toBe(24 - 12);
  });

  it("routes everyone but the 12 purinstinct players into a single speed race in speedMode", () => {
    const pMap = makePlayers(30);
    const result = planRound({
      availableIds: Object.keys(pMap).map(Number),
      pMap, zoneCount: 2, speedMode: true, secondaryZoneUsage: {},
    });
    expect(result.secondaryZones).toEqual([]);
    expect(result.speedQueue.length).toBe(30 - 12);
  });

  it("handles fewer than 12 available players without crashing", () => {
    const pMap = makePlayers(8);
    const result = planRound({
      availableIds: Object.keys(pMap).map(Number),
      pMap, zoneCount: 1, speedMode: false, secondaryZoneUsage: {},
    });
    expect(result.purinstinct.teamA.length + result.purinstinct.teamB.length).toBe(8);
    expect(Object.values(result.secondaryAssignments).flat().length).toBe(0);
  });

  it("increments usage counts for the secondary zones it opened", () => {
    const pMap = makePlayers(24);
    const result = planRound({
      availableIds: Object.keys(pMap).map(Number),
      pMap, zoneCount: 2, speedMode: false, secondaryZoneUsage: { handAgility: 1 },
    });
    result.secondaryZones.forEach((z) => {
      const before = z === "handAgility" ? 1 : 0;
      expect(result.updatedZoneUsage[z]).toBe(before + 1);
    });
  });
});
