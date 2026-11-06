import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { canTransferItem, canDropLoot, allowedMessageUpdate } from '../src/utils/socket-auth.js';
import { tamsHandleSocket } from '../src/utils/socket.js';
import { claimOnce, CLAIM_WAIT_MS } from '../src/utils/gm-claim.js';

const player = { id: "player1", name: "Player" };
const victim = { id: "player2", name: "Victim" };
const gm = { id: "gm1", name: "GM" };

/** A permission check keyed on who owns the document. */
const ownedBy = (...users) => (user, level) => level === "OWNER" && users.some(u => u.id === user.id);

function makeItem(id, name, owners) {
  return {
    id, name, type: "weapon", documentName: "Item",
    system: { location: "carried", equipped: true },
    testUserPermission: ownedBy(...owners),
    toObject() { return { _id: id, name, type: "weapon", system: { location: "carried", equipped: true } }; },
  };
}

function makeActor(uuid, owners, items = []) {
  const actor = {
    uuid, isOwner: true,
    items: Object.assign(items, { get: id => items.find(i => i.id === id) }),
    testUserPermission: ownedBy(...owners),
    createEmbeddedDocuments: vi.fn(async (_type, data) => data),
    deleteEmbeddedDocuments: vi.fn(async (_type, ids) => ids.map(id => ({ id }))),
  };
  return actor;
}

describe('canTransferItem', () => {
  const item = makeItem("i1", "Sword", [player]);
  it('allows an owner handing over an item on their actor', () => {
    expect(canTransferItem(player, makeActor("A", [player], [item]), item)).toBe(true);
  });
  it('refuses when the sender does not own the source actor', () => {
    expect(canTransferItem(player, makeActor("A", [victim], [item]), item)).toBe(false);
  });
  it('refuses when there is no source actor or the item is not on it', () => {
    expect(canTransferItem(player, null, item)).toBe(false);
    expect(canTransferItem(player, makeActor("A", [player]), undefined)).toBe(false);
  });
});

describe('canDropLoot', () => {
  it('allows items the sender owns', () => {
    expect(canDropLoot(player, makeItem("i1", "Sword", [player]))).toBe(true);
  });
  it('refuses items the sender does not own', () => {
    expect(canDropLoot(player, makeItem("i1", "Sword", [victim]))).toBe(false);
  });
  it('refuses compendium entries, non-items and missing documents', () => {
    expect(canDropLoot(player, { ...makeItem("i1", "Sword", [player]), pack: "tams.items" })).toBe(false);
    expect(canDropLoot(player, { ...makeItem("a1", "Actor", [player]), documentName: "Actor" })).toBe(false);
    expect(canDropLoot(player, null)).toBe(false);
  });
});

describe('allowedMessageUpdate', () => {
  const own = { author: { id: "player1" } };
  it('keeps only the content of a message the sender wrote', () => {
    expect(allowedMessageUpdate(player, own, { content: "<p>x</p>", author: "gm1", whisper: [], rolls: [] }))
      .toEqual({ content: "<p>x</p>" });
  });
  it("refuses someone else's message", () => {
    expect(allowedMessageUpdate(victim, own, { content: "x" })).toBeNull();
  });
  it('refuses updates with no string content', () => {
    expect(allowedMessageUpdate(player, own, { whisper: [] })).toBeNull();
    expect(allowedMessageUpdate(player, null, { content: "x" })).toBeNull();
  });
});

describe('tamsHandleSocket', () => {
  let saved, docs, users, message;

  beforeEach(() => {
    saved = { game: global.game, fromUuid: global.fromUuid, foundry: global.foundry };
    users = new Map([[player.id, player], [victim.id, victim], [gm.id, gm]]);
    docs = new Map();
    message = { author: { id: gm.id }, update: vi.fn() };
    global.game = {
      ...saved.game,
      user: { id: gm.id, isGM: true },
      users: { get: id => users.get(id), activeGM: gm },
      messages: { get: () => message },
    };
    global.fromUuid = async uuid => docs.get(uuid) ?? null;
    global.foundry = {
      ...saved.foundry,
      documents: { ...saved.foundry?.documents, BaseActor: Object },
      utils: { ...saved.foundry?.utils, duplicate: o => JSON.parse(JSON.stringify(o)) },
    };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.assign(global, saved);
    vi.restoreAllMocks();
  });

  function transferScene() {
    const sword = makeItem("i1", "Sword", [victim]);
    const source = makeActor("Actor.victim", [victim], [sword]);
    const target = makeActor("Actor.player", [player]);
    docs.set(source.uuid, source);
    docs.set(target.uuid, target);
    return { sword, source, target };
  }

  it("records another client's claim only when it comes from this GM", async () => {
    vi.useFakeTimers();
    game.socket = { id: "z", emit: vi.fn() };
    await tamsHandleSocket({ type: "gmClaim", key: "forged", clientId: "a" }, victim.id);
    const forged = claimOnce("forged");
    await vi.advanceTimersByTimeAsync(CLAIM_WAIT_MS);
    expect(await forged).toBe(true);

    await tamsHandleSocket({ type: "gmClaim", key: "real", clientId: "a" }, gm.id);
    expect(await claimOnce("real")).toBe(false);
    vi.useRealTimers();
  });

  it('ignores requests on a GM client that is not the active GM', async () => {
    game.users.activeGM = { id: "gm2" };
    const { source, target } = transferScene();
    await tamsHandleSocket({ type: "transferItem", itemId: "i1", sourceActorUuid: source.uuid, targetActorUuid: target.uuid }, victim.id);
    expect(target.createEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it('ignores requests on player clients and from unknown senders', async () => {
    const { source, target } = transferScene();
    const request = { type: "transferItem", itemId: "i1", sourceActorUuid: source.uuid, targetActorUuid: target.uuid };
    await tamsHandleSocket(request, "nobody");
    game.user = { id: player.id, isGM: false };
    await tamsHandleSocket(request, victim.id);
    expect(target.createEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it('moves the real item when the owner gives it away', async () => {
    const { source, target } = transferScene();
    await tamsHandleSocket({
      type: "transferItem", itemId: "i1", itemData: { name: "Forged", system: {} },
      sourceActorUuid: source.uuid, targetActorUuid: target.uuid, newLocation: "stowed",
    }, victim.id);
    const [[, created]] = target.createEmbeddedDocuments.mock.calls;
    expect(created[0].name).toBe("Sword");
    expect(created[0].system.location).toBe("stowed");
    expect(source.deleteEmbeddedDocuments).toHaveBeenCalledWith("Item", ["i1"]);
  });

  describe('a GM logged in on two clients', () => {
    const request = (source, target) => ({
      type: "transferItem", itemId: "i1", sourceActorUuid: source.uuid, targetActorUuid: target.uuid, newLocation: "stowed",
    });

    it('deletes the source item before creating the copy', async () => {
      const { source, target } = transferScene();
      await tamsHandleSocket(request(source, target), victim.id);
      expect(source.deleteEmbeddedDocuments.mock.invocationCallOrder[0])
        .toBeLessThan(target.createEmbeddedDocuments.mock.invocationCallOrder[0]);
    });

    it('creates nothing when the other client already deleted it', async () => {
      const { source, target } = transferScene();
      source.deleteEmbeddedDocuments.mockRejectedValue(new Error('Item does not exist!'));
      await expect(tamsHandleSocket(request(source, target), victim.id)).resolves.toBeUndefined();
      expect(target.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it('creates nothing when the server deleted nothing for this client', async () => {
      const { source, target } = transferScene();
      source.deleteEmbeddedDocuments.mockResolvedValue([]);
      await tamsHandleSocket(request(source, target), victim.id);
      expect(target.createEmbeddedDocuments).not.toHaveBeenCalled();
    });

    it('puts the item back when creating the copy fails', async () => {
      const { source, target } = transferScene();
      target.createEmbeddedDocuments.mockRejectedValue(new Error('nope'));
      await expect(tamsHandleSocket(request(source, target), victim.id)).rejects.toThrow('nope');
      const [[, restored, options]] = source.createEmbeddedDocuments.mock.calls;
      expect(restored[0]._id).toBe("i1");
      expect(options).toEqual({ keepId: true });
    });

    describe('loot drops', () => {
      let sword, source, lootActor;
      const drop = () => tamsHandleSocket({ type: "createLoot", lootData: { uuid: "Item.i1" }, x: 1, y: 2 }, victim.id);

      beforeEach(() => {
        sword = Object.assign(Object.create(global.Item.prototype), makeItem("i1", "Sword", [victim]));
        Object.defineProperty(sword, 'uuid', { value: "Item.i1" });
        source = makeActor("Actor.victim", [victim], [sword]);
        Object.defineProperty(sword, 'actor', { value: source });
        docs.set("Item.i1", sword);
        lootActor = {
          createEmbeddedDocuments: vi.fn(async (_type, data) => data),
          delete: vi.fn(async () => {}),
          getTokenDocument: vi.fn(async () => ({ toObject: () => ({}) })),
        };
        saved.Actor = global.Actor; saved.canvas = global.canvas; saved.CONST = global.CONST;
        global.Actor = { create: vi.fn(async () => lootActor) };
        global.canvas = { scene: { createEmbeddedDocuments: vi.fn(async () => []) } };
        global.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } };
        global.game.i18n = { localize: k => k };
        vi.spyOn(console, 'error').mockImplementation(() => {});
      });

      it('makes one pile from the item it deleted', async () => {
        await drop();
        expect(source.deleteEmbeddedDocuments).toHaveBeenCalledWith("Item", ["i1"]);
        expect(lootActor.createEmbeddedDocuments.mock.calls[0][1][0].name).toBe("Sword");
        expect(global.canvas.scene.createEmbeddedDocuments).toHaveBeenCalledTimes(1);
      });

      it('makes no pile when the other client already deleted it', async () => {
        source.deleteEmbeddedDocuments.mockRejectedValue(new Error('Item does not exist!'));
        await drop();
        expect(global.Actor.create).not.toHaveBeenCalled();
        expect(global.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
      });

      it('puts the item back and removes the pile when the copy fails', async () => {
        lootActor.createEmbeddedDocuments.mockRejectedValue(new Error('nope'));
        await drop();
        expect(lootActor.delete).toHaveBeenCalled();
        expect(source.createEmbeddedDocuments.mock.calls[0][1][0]._id).toBe("i1");
        expect(global.canvas.scene.createEmbeddedDocuments).not.toHaveBeenCalled();
      });
    });
  });

  it('refuses a player taking an item, even when the request names a GM as userId', async () => {
    const { source, target } = transferScene();
    await tamsHandleSocket({
      type: "transferItem", userId: gm.id, itemId: "i1",
      sourceActorUuid: source.uuid, targetActorUuid: target.uuid,
    }, player.id);
    expect(target.createEmbeddedDocuments).not.toHaveBeenCalled();
    expect(source.deleteEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it('refuses minting an item from request data', async () => {
    const { target } = transferScene();
    await tamsHandleSocket({
      type: "transferItem", itemData: { _id: "x", name: "Minted", system: {} },
      targetActorUuid: target.uuid,
    }, player.id);
    expect(target.createEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it('refuses a loot drop of an item the sender does not own', async () => {
    const sword = makeItem("i1", "Sword", [victim]);
    docs.set("Actor.victim.Item.i1", sword);
    global.Actor = { create: vi.fn() };
    await tamsHandleSocket({ type: "createLoot", lootData: { uuid: "Actor.victim.Item.i1" }, x: 0, y: 0 }, player.id);
    await tamsHandleSocket({ type: "createLoot", lootData: { data: { name: "Minted" } }, x: 0, y: 0 }, player.id);
    expect(Actor.create).not.toHaveBeenCalled();
  });

  it("refuses rewriting a GM message, even when the request names the GM as userId", async () => {
    await tamsHandleSocket({ type: "updateMessage", messageId: "m1", userId: gm.id, updateData: { content: "forged" } }, player.id);
    expect(message.update).not.toHaveBeenCalled();
  });

  it('lets an author update the content of their own message', async () => {
    message.author = { id: player.id };
    await tamsHandleSocket({ type: "updateMessage", messageId: "m1", updateData: { content: "ok", whisper: [] } }, player.id);
    expect(message.update).toHaveBeenCalledWith({ content: "ok" });
  });
});
