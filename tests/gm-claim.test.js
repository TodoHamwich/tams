import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { claimOnce, noteClaim, CLAIM_WAIT_MS } from '../src/utils/gm-claim.js';

const gm = { id: 'gm1', isGM: true };
let n = 0;
const key = () => `turn:${n++}`;

describe('claimOnce', () => {
  let saved;
  beforeEach(() => {
    vi.useFakeTimers();
    saved = global.game;
    global.game = { user: gm, users: { activeGM: gm }, socket: { id: 'bbb', emit: vi.fn() } };
  });
  afterEach(() => {
    vi.useRealTimers();
    global.game = saved;
  });

  const settle = async (promise) => {
    await vi.advanceTimersByTimeAsync(CLAIM_WAIT_MS);
    return promise;
  };

  it('wins alone and tells the other clients', async () => {
    const k = key();
    expect(await settle(claimOnce(k))).toBe(true);
    expect(game.socket.emit).toHaveBeenCalledWith('system.tams', { type: 'gmClaim', key: k, clientId: 'bbb' });
  });

  it('refuses a player', async () => {
    game.user = { id: 'p', isGM: false };
    expect(await settle(claimOnce(key()))).toBe(false);
    expect(game.socket.emit).not.toHaveBeenCalled();
  });

  it('refuses a GM who is not the active GM', async () => {
    game.users.activeGM = { id: 'gm2' };
    expect(await settle(claimOnce(key()))).toBe(false);
    expect(game.socket.emit).not.toHaveBeenCalled();
  });

  it('stands aside without announcing when another client already claimed', async () => {
    const k = key();
    noteClaim(k, 'zzz');
    expect(await settle(claimOnce(k))).toBe(false);
    expect(game.socket.emit).not.toHaveBeenCalled();
  });

  it('a tie goes to the lowest id, so exactly one wins', async () => {
    const k = key();
    const pending = claimOnce(k);
    noteClaim(k, 'zzz');
    expect(await settle(pending)).toBe(true);

    const k2 = key();
    const losing = claimOnce(k2);
    noteClaim(k2, 'aaa');
    expect(await settle(losing)).toBe(false);
  });

  it('the same turn can be claimed again later', async () => {
    const k = key();
    expect(await settle(claimOnce(k))).toBe(true);
    expect(await settle(claimOnce(k))).toBe(true);
  });

  it('an old claim from another client expires', async () => {
    const k = key();
    noteClaim(k, 'zzz');
    await vi.advanceTimersByTimeAsync(6000);
    expect(await settle(claimOnce(k))).toBe(true);
  });
});
