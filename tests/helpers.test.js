import { describe, it, expect } from 'vitest';
import { getHitLocation, computeSquadAttackBonus, moveInOrder } from '../src/utils/helpers.js';

describe('getHitLocation', () => {
  it('returns Head for 96+', async () => {
    expect(await getHitLocation(96)).toBe("Head");
    expect(await getHitLocation(100)).toBe("Head");
  });

  it('returns Thorax for 56-95', async () => {
    expect(await getHitLocation(56)).toBe("Thorax");
    expect(await getHitLocation(95)).toBe("Thorax");
  });

  it('returns Stomach for 41-55', async () => {
    expect(await getHitLocation(41)).toBe("Stomach");
    expect(await getHitLocation(55)).toBe("Stomach");
  });

  it('returns Left Arm for 31-40', async () => {
    expect(await getHitLocation(31)).toBe("Left Arm");
    expect(await getHitLocation(40)).toBe("Left Arm");
  });

  it('returns Right Arm for 21-30', async () => {
    expect(await getHitLocation(21)).toBe("Right Arm");
    expect(await getHitLocation(30)).toBe("Right Arm");
  });

  it('returns Left Leg for 11-20', async () => {
    expect(await getHitLocation(11)).toBe("Left Leg");
    expect(await getHitLocation(20)).toBe("Left Leg");
  });

  it('returns Right Leg for 1-10', async () => {
    expect(await getHitLocation(1)).toBe("Right Leg");
    expect(await getHitLocation(10)).toBe("Right Leg");
  });

  it('uses a random roll if no value provided', async () => {
    // In our mock, Roll.total is 50, which should be Thorax (actually Thorax is 56+)
    // Wait, let's check the logic: 
    // if (raw >= 96) Head
    // if (raw >= 56) Thorax
    // if (raw >= 41) Stomach
    // So 50 should be Stomach.
    expect(await getHitLocation()).toBe("Stomach");
  });
});

describe('computeSquadAttackBonus', () => {
  it('melee: +5 per unused possible attack (full size)', () => {
    expect(computeSquadAttackBonus(8, false, 1)).toEqual({ maxTargets: 8, bonus: 35 });
    expect(computeSquadAttackBonus(3, false, 2)).toEqual({ maxTargets: 3, bonus: 5 });
    expect(computeSquadAttackBonus(8, false, 0)).toEqual({ maxTargets: 8, bonus: 40 });
  });

  it('ranged: possible attacks are half size', () => {
    expect(computeSquadAttackBonus(8, true, 2)).toEqual({ maxTargets: 4, bonus: 10 });
  });

  it('no bonus when targets fill every possible attack', () => {
    expect(computeSquadAttackBonus(8, true, 4).bonus).toBe(0);
    expect(computeSquadAttackBonus(4, false, 6).bonus).toBe(0);
  });
});

describe('moveInOrder', () => {
  const sorted = ids => ids.map((_id, i) => ({ _id, sort: (i + 1) * 100000 }));

  it('swaps an item with its upper neighbour and renumbers', () => {
    expect(moveInOrder(['a', 'b', 'c'], 'b', -1)).toEqual(sorted(['b', 'a', 'c']));
  });

  it('swaps an item with its lower neighbour', () => {
    expect(moveInOrder(['a', 'b', 'c'], 'b', 1)).toEqual(sorted(['a', 'c', 'b']));
  });

  it('does nothing at either end, for a single item, or an unknown id', () => {
    expect(moveInOrder(['a', 'b'], 'a', -1)).toEqual([]);
    expect(moveInOrder(['a', 'b'], 'b', 1)).toEqual([]);
    expect(moveInOrder(['a'], 'a', 1)).toEqual([]);
    expect(moveInOrder(['a', 'b'], 'z', 1)).toEqual([]);
  });
});
