/* ══════════════════════════════════════════════
   db/jsonStore.js
   A tiny dependency-free JSON file datastore.
   Each "table" is one .json file inside /db/data.
   Good enough for small apps; swap for MySQL/
   PostgreSQL/MongoDB later without changing routes
   much, since all access goes through this module.
══════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function filePath(table) {
  return path.join(DATA_DIR, `${table}.json`);
}

function readTable(table) {
  const fp = filePath(table);
  if (!fs.existsSync(fp)) return [];
  const raw = fs.readFileSync(fp, 'utf-8').trim();
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${table}.json:`, e.message);
    return [];
  }
}

function writeTable(table, records) {
  fs.writeFileSync(filePath(table), JSON.stringify(records, null, 2));
}

function nextId(records) {
  if (records.length === 0) return 1;
  return Math.max(...records.map(r => r.id)) + 1;
}

const db = {
  /** Return all records, optionally filtered by a predicate fn */
  all(table, predicate) {
    const records = readTable(table);
    return predicate ? records.filter(predicate) : records;
  },

  /** Find a single record by id */
  findById(table, id) {
    return readTable(table).find(r => r.id === Number(id));
  },

  /** Find a single record matching a predicate */
  findOne(table, predicate) {
    return readTable(table).find(predicate);
  },

  /** Insert a new record, auto-assigning an id. Returns the created record. */
  insert(table, data) {
    const records = readTable(table);
    const record = { id: nextId(records), createdAt: new Date().toISOString(), ...data };
    records.push(record);
    writeTable(table, records);
    return record;
  },

  /** Update a record by id with partial data. Returns the updated record or null. */
  update(table, id, data) {
    const records = readTable(table);
    const idx = records.findIndex(r => r.id === Number(id));
    if (idx === -1) return null;
    records[idx] = { ...records[idx], ...data, updatedAt: new Date().toISOString() };
    writeTable(table, records);
    return records[idx];
  },

  /** Delete a record by id. Returns true if deleted. */
  remove(table, id) {
    const records = readTable(table);
    const next = records.filter(r => r.id !== Number(id));
    const deleted = next.length !== records.length;
    if (deleted) writeTable(table, next);
    return deleted;
  },

  /** Overwrite an entire table — used rarely (e.g. seeding) */
  seed(table, records) {
    writeTable(table, records);
  },
};

module.exports = db;