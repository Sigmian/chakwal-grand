// ============================================================
// features/experience/lib/layout.ts
//
// Database room  →  3D position mapping.
//
// Kept in one place and derived from the building's real
// dimensions, so adding or renaming a room in the admin panel
// needs no code change: rooms are laid out along their storey's
// street façade in the order they come back from the database.
// ============================================================

import type { BranchKey } from "./buildings";

export interface BranchLayout {
  /** Building footprint used for hotspot placement. */
  width: number;
  depth: number;
  /** Storey base heights and heights, matching buildings.ts. */
  levels: { base: number; height: number }[];
  /** How far the site plate extends — used for camera framing. */
  siteWidth: number;
  siteDepth: number;
  /** Vertical gap between storeys when the building is exploded. */
  explodeGap: number;
}

export const BRANCH_LAYOUT: Record<BranchKey, BranchLayout> = {
  main: {
    width: 25,
    depth: 14,
    levels: [
      { base: 0.3,  height: 4.1 },
      { base: 4.4,  height: 3.5 },
      { base: 7.9,  height: 3.5 },
    ],
    siteWidth: 36,
    siteDepth: 27,
    explodeGap: 3.2,
  },
  madina: {
    width: 16,
    depth: 12,
    levels: [
      { base: 0.3, height: 3.9 },
      { base: 4.2, height: 3.5 },
    ],
    siteWidth: 32,
    siteDepth: 26,
    explodeGap: 3.0,
  },
};

/** Where the two buildings sit relative to each other in the branch-selection scene. */
export const BRANCH_ANCHOR: Record<BranchKey, [number, number, number]> = {
  main:   [-24, 0, 0],
  madina: [24, 0, 0],
};

/**
 * Hotspot position for a room, in the branch's local space.
 *
 * Rooms spread evenly across the façade width at their storey's
 * mid-height, pushed just clear of the wall so the marker never
 * z-fights with the glazing.
 */
export function roomHotspot(
  branch: BranchKey,
  floorIndex: number,
  roomIndex: number,
  roomsOnFloor: number,
): [number, number, number] {
  const L = BRANCH_LAYOUT[branch];
  const lvl = L.levels[Math.min(floorIndex, L.levels.length - 1)];
  const y = lvl.base + lvl.height * 0.55;

  // Spread across the façade, leaving a margin at each end.
  const usable = L.width * 0.78;
  const step = roomsOnFloor > 1 ? usable / (roomsOnFloor - 1) : 0;
  const x = roomsOnFloor > 1 ? -usable / 2 + roomIndex * step : 0;
  const z = L.depth / 2 + 1.15;

  return [x, y, z];
}

/** Y offset applied to a storey when the building is exploded. */
export function explodeOffset(branch: BranchKey, floorIndex: number, exploded: boolean) {
  if (!exploded) return 0;
  return floorIndex * BRANCH_LAYOUT[branch].explodeGap;
}

/** Roof lifts above the top storey by a little more than a full gap. */
export function roofExplodeOffset(branch: BranchKey, exploded: boolean) {
  if (!exploded) return 0;
  const L = BRANCH_LAYOUT[branch];
  return L.levels.length * L.explodeGap;
}
