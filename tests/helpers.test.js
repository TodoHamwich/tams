import { describe, it, expect } from 'vitest';
import { getHitLocation } from '../src/utils/helpers.js';

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
