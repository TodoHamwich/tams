/**
 * Make sure only one client runs something that isn't safe to run twice.
 *
 * `game.users.activeGM` picks a user, not a client, so a GM with two tabs open passes that check
 * twice. Those clients agree between themselves here: each announces itself on the socket, waits
 * briefly, and the lowest socket id wins. A client that hears a claim before its own hook fires is
 * already behind, so it stands aside without announcing.
 */

/** How long to wait for other clients' claims, in milliseconds. */
export const CLAIM_WAIT_MS = 300;

/** How long a claim counts for, so repeating the same turn later can claim again. */
const CLAIM_EXPIRY_MS = 5000;

/** Claim key → client ids heard from, on this client. */
const claims = new Map();

/**
 * Record a claim from another client of this GM.
 * @param {string} key What is being claimed.
 * @param {string} clientId The claiming client's socket id.
 */
export function noteClaim(key, clientId) {
  if (!claims.has(key)) {
    claims.set(key, new Set());
    setTimeout(() => claims.delete(key), CLAIM_EXPIRY_MS);
  }
  claims.get(key).add(clientId);
}

/**
 * Ask to be the one client that handles `key`. Other GM users' clients always lose.
 * @param {string} key Identifies the event, the same on every client.
 * @returns {Promise<boolean>} Whether this client should handle it.
 */
export async function claimOnce(key) {
  if (!game.user.isGM || game.users.activeGM?.id !== game.user.id) return false;
  if (claims.get(key)?.size) return false;

  const me = game.socket.id;
  noteClaim(key, me);
  game.socket.emit("system.tams", { type: "gmClaim", key, clientId: me });
  await new Promise(resolve => setTimeout(resolve, CLAIM_WAIT_MS));

  const won = [...claims.get(key)].every(id => id >= me);
  claims.delete(key);
  return won;
}
