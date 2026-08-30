import { describe, it, expect } from 'vitest';
import {
  computeRawStaminaMax, computeRawResourceMax, computeFatiguedMax,
  computeShortRestFatigueGain, computeLongRestTickHeal, computeLongRestFatigueHeal
} from '../src/utils/fatigue.js';

describe('computeRawStaminaMax', () => {
  it('applies the mult and trait extra to endurance', () => {
    expect(computeRawStaminaMax(12, 1.5, 0)).toBe(18);
    expect(computeRawStaminaMax(10, 1.0, 5)).toBe(15);
  });

  it('floors endurance at 1', () => {
    expect(computeRawStaminaMax(0, 1.0, 0)).toBe(1);
  });
});

describe('computeRawResourceMax', () => {
  it('applies mult and bonus to a stat value', () => {
    expect(computeRawResourceMax(20, 1.0, 0)).toBe(20);
    expect(computeRawResourceMax(10, 2.0, 1)).toBe(21);
  });
});

describe('computeFatiguedMax', () => {
  it('subtracts fatigue from raw max', () => {
    expect(computeFatiguedMax(18, 5)).toBe(13);
  });

  it('treats missing/zero fatigue as no reduction', () => {
    expect(computeFatiguedMax(18, 0)).toBe(18);
    expect(computeFatiguedMax(18)).toBe(18);
  });

  it('clamps at 0 when fatigue exceeds raw max', () => {
    expect(computeFatiguedMax(18, 100)).toBe(0);
  });
});

describe('computeShortRestFatigueGain', () => {
  it('returns 0 when nothing was spent', () => {
    expect(computeShortRestFatigueGain(0)).toBe(0);
    expect(computeShortRestFatigueGain()).toBe(0);
  });

  it('floors at 1 for any spending under 10', () => {
    expect(computeShortRestFatigueGain(1)).toBe(1);
    expect(computeShortRestFatigueGain(9)).toBe(1);
  });

  it('uses floor(spent/10) once above the minimum', () => {
    expect(computeShortRestFatigueGain(10)).toBe(1);
    expect(computeShortRestFatigueGain(19)).toBe(1);
    expect(computeShortRestFatigueGain(20)).toBe(2);
    expect(computeShortRestFatigueGain(25)).toBe(2);
    expect(computeShortRestFatigueGain(100)).toBe(10);
  });
});

describe('computeLongRestTickHeal / computeLongRestFatigueHeal', () => {
  it('heals floor(stat/10) per tick, doubled when bundled', () => {
    expect(computeLongRestTickHeal(10)).toBe(1);
    expect(computeLongRestFatigueHeal(10)).toBe(2);
  });

  it('returns 0 for a stat of 0', () => {
    expect(computeLongRestTickHeal(0)).toBe(0);
    expect(computeLongRestFatigueHeal(0)).toBe(0);
  });

  it('scales with larger stat values', () => {
    expect(computeLongRestTickHeal(105)).toBe(10);
    expect(computeLongRestFatigueHeal(105)).toBe(20);
  });
});
