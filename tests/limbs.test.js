import { describe, it, expect } from 'vitest';
import {
  HIT_TABLE, isLimbMissing, locationIsMissing, presentHitTable, presentHitWeight, locationFromRoll
} from '../src/utils/limbs.js';

const limbs = (missing = []) => Object.fromEntries(HIT_TABLE.map(r => [r.key, { missing: missing.includes(r.key) }]));

describe('locationFromRoll', () => {
  it('matches the rulebook d100 table with every limb present', () => {
    const cases = [[1, "Right Leg"], [10, "Right Leg"], [11, "Left Leg"], [20, "Left Leg"], [21, "Right Arm"],
      [30, "Right Arm"], [31, "Left Arm"], [40, "Left Arm"], [41, "Stomach"], [55, "Stomach"],
      [56, "Thorax"], [95, "Thorax"], [96, "Head"], [100, "Head"]];
    for (const [roll, label] of cases) expect(locationFromRoll(roll, limbs())).toBe(label);
  });

  it('keeps the old behaviour for out-of-range rolls', () => {
    expect(locationFromRoll(0)).toBe("Right Leg");
    expect(locationFromRoll(150)).toBe("Head");
  });

  it('skips missing limbs, closing the gap in the table', () => {
    const l = limbs(["rightLeg"]);
    expect(presentHitWeight(l)).toBe(90);
    expect(locationFromRoll(1, l)).toBe("Left Leg");
    expect(locationFromRoll(90, l)).toBe("Head");
  });

  it('returns null when every limb is missing', () => {
    const l = limbs(HIT_TABLE.map(r => r.key));
    expect(presentHitWeight(l)).toBe(0);
    expect(locationFromRoll(1, l)).toBeNull();
  });
});

describe('missing limb checks', () => {
  it('treats an absent flag as present', () => {
    expect(isLimbMissing({})).toBe(false);
    expect(isLimbMissing(undefined)).toBe(false);
    expect(isLimbMissing({ missing: true })).toBe(true);
  });

  it('maps location labels to limbs', () => {
    const l = limbs(["leftArm"]);
    expect(locationIsMissing("Left Arm", l)).toBe(true);
    expect(locationIsMissing("Right Arm", l)).toBe(false);
    expect(locationIsMissing("Left Arm", undefined)).toBe(false);
    expect(locationIsMissing("Nowhere", l)).toBe(false);
  });

  it('lists only present limbs', () => {
    expect(presentHitTable(limbs(["head", "thorax"])).map(r => r.key))
      .toEqual(["rightLeg", "leftLeg", "rightArm", "leftArm", "stomach"]);
  });
});
