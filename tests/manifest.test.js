import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

describe('compendium pack source', () => {
  const packs = readdirSync('packs/_src');
  const docsIn = (pack) => readdirSync(join('packs/_src', pack))
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ file, doc: readJson(join('packs/_src', pack, file)) }));

  // Foundry's migration blanks a malformed _id on world launch and writes the record
  // to a null key, leaving a ghost document in the pack.
  it.each(packs)('%s: every _id is 16 alphanumeric characters', (pack) => {
    const invalid = docsIn(pack).filter(({ doc }) => !/^[a-zA-Z0-9]{16}$/.test(doc._id ?? ''));
    expect(invalid.map(({ file }) => file)).toEqual([]);
  });

  it.each(packs)('%s: every _key ends in its own _id', (pack) => {
    const mismatched = docsIn(pack).filter(({ doc }) => !doc._key?.endsWith(`!${doc._id}`));
    expect(mismatched.map(({ file }) => file)).toEqual([]);
  });

  it('macros: no document sets an author, since a pack has no valid user to name', () => {
    const authored = docsIn('macros').filter(({ doc }) => 'author' in doc);
    expect(authored.map(({ file }) => file)).toEqual([]);
  });

  it.each(packs)('%s: _ids are unique', (pack) => {
    const ids = docsIn(pack).map(({ doc }) => doc._id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('system.json documentTypes', () => {
  const declared = readJson('system.json').documentTypes;
  const source = readFileSync('src/tams.js', 'utf8');
  const registered = (documentName) => [...source.matchAll(
    new RegExp(`CONFIG\\.${documentName}\\.dataModels\\.(\\w+)\\s*=`, 'g'),
  )].map((match) => match[1]).sort();

  it.each(['Actor', 'Item'])('%s types match the registered DataModels', (documentName) => {
    expect(Object.keys(declared[documentName]).sort()).toEqual(registered(documentName));
  });
});
