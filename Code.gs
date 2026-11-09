/**
 * Kitchen Low-Stock Log — Google Sheet backend
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet.
 * Run `setup` once, then Deploy → New deployment → Web app.
 * The team PIN lives in Project Settings → Script Properties → TEAM_PIN.
 */

const TABS = {
  Items: ['id', 'name', 'unit', 'category', 'defaultQty'],
  Flags: ['week', 'itemId', 'qty', 'days', 'updatedAt'],
  Weeks: ['week', 'status', 'orderedAt'],
};

const SEED_ITEMS = [
  ['brown-onions', 'Brown onions', 'kg', 'Veg', 10],
  ['red-onions', 'Red onions', 'kg', 'Veg', 5],
  ['garlic', 'Garlic', 'kg', 'Veg', 1],
  ['potatoes', 'Potatoes', 'kg', 'Veg', 15],
  ['carrots', 'Carrots', 'kg', 'Veg', 5],
  ['tomatoes', 'Tomatoes', 'kg', 'Veg', 5],
  ['red-capsicum', 'Red capsicum', 'kg', 'Veg', 3],
  ['mushrooms', 'Mushrooms', 'kg', 'Veg', 2],
  ['ginger', 'Ginger', 'kg', 'Veg', 0.5],
  ['chillies', 'Red chillies', 'kg', 'Veg', 0.5],
  ['lemons', 'Lemons', 'kg', 'Fruit', 3],
  ['limes', 'Limes', 'kg', 'Fruit', 2],
  ['avocados', 'Avocados', 'tray', 'Fruit', 1],
  ['bananas', 'Bananas', 'kg', 'Fruit', 3],
  ['coriander', 'Coriander', 'bunch', 'Herbs', 6],
  ['parsley', 'Flat-leaf parsley', 'bunch', 'Herbs', 4],
  ['mint', 'Mint', 'bunch', 'Herbs', 3],
  ['spring-onions', 'Spring onions', 'bunch', 'Herbs', 4],
  ['cos', 'Cos lettuce', 'each', 'Salad', 8],
  ['rocket', 'Rocket', 'kg', 'Salad', 1],
  ['cucumbers', 'Cucumbers', 'each', 'Salad', 6],
];

/* ---------- one-time setup: run this from the editor ---------- */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    // Store everything as plain text so dates like 2026-11-15 aren't converted.
    sh.getRange(1, 1, sh.getMaxRows(), TABS[name].length).setNumberFormat('@');
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  const items = ss.getSheetByName('Items');
  if (items.getLastRow() === 1) {
    items.getRange(2, 1, SEED_ITEMS.length, 5)
      .setValues(SEED_ITEMS.map(function (r) { return r.map(String); }));
  }
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('TEAM_PIN')) props.setProperty('TEAM_PIN', '1234');
  const blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1 && blank.getLastRow() === 0) ss.deleteSheet(blank);
}

/* ---------- web app entry points ---------- */
function doPost(e) {
  let p = {};
  try { p = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  return respond(p);
}
function doGet(e) { return respond((e && e.parameter) || {}); }

function respond(p) {
  let result;
  try {
    const pin = PropertiesService.getScriptProperties().getProperty('TEAM_PIN') || '';
    if (String(p.pin || '') !== String(pin)) {
      result = { ok: false, error: 'bad_pin' };
    } else if (!ACTIONS[p.action]) {
      result = { ok: false, error: 'unknown_action' };
    } else if (p.action === 'load') {
      result = Object.assign({ ok: true }, load(p.week));
    } else {
      const lock = LockService.getScriptLock();
      lock.waitLock(15000);
      try { ACTIONS[p.action](p); } finally { lock.releaseLock(); }
      result = Object.assign({ ok: true }, load(p.week));
    }
  } catch (err) {
    result = { ok: false, error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

const ACTIONS = {
  load: function () {},

  // Set or clear the low-stock flag for one item in one week.
  setFlag: function (p) {
    requireWeek(p.week);
    const sh = tab('Flags');
    const found = readRows('Flags').filter(function (r) { return r.week === p.week && r.itemId === p.itemId; })[0];
    const days = (p.days || []).filter(function (d) { return DAY_KEYS.indexOf(d) >= 0; });
    const qty = Number(p.qty);
    if (!days.length || !(qty > 0)) {
      if (found) sh.deleteRow(found._row);
      return;
    }
    const values = [p.week, String(p.itemId), String(qty), days.join(','), new Date().toISOString()];
    writeRow(sh, found ? found._row : sh.getLastRow() + 1, values);
  },

  setWeek: function (p) {
    requireWeek(p.week);
    const sh = tab('Weeks');
    const found = readRows('Weeks').filter(function (r) { return r.week === p.week; })[0];
    const status = p.status === 'ordered' ? 'ordered' : 'open';
    const values = [p.week, status, status === 'ordered' ? new Date().toISOString() : ''];
    writeRow(sh, found ? found._row : sh.getLastRow() + 1, values);
  },

  addItem: function (p) {
    const name = String(p.name || '').trim();
    if (!name) throw new Error('Item name is empty');
    const sh = tab('Items');
    const id = Utilities.getUuid().slice(0, 8);
    writeRow(sh, sh.getLastRow() + 1, [id, name, String(p.unit || 'each').trim() || 'each',
      String(p.category || 'Other'), String(Number(p.defaultQty) || 1)]);
  },

  deleteItem: function (p) {
    const found = readRows('Items').filter(function (r) { return r.id === p.id; })[0];
    if (found) tab('Items').deleteRow(found._row);
  },
};

/* ---------- helpers ---------- */
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function load(week) {
  const items = readRows('Items').filter(function (r) { return r.id && r.name; }).map(function (r) {
    return { id: r.id, name: r.name, unit: r.unit || 'each', category: r.category || 'Other', defaultQty: Number(r.defaultQty) || 1 };
  });
  const flags = readRows('Flags').filter(function (r) { return r.week === week; }).map(function (r) {
    return { itemId: r.itemId, qty: Number(r.qty) || 0, days: r.days ? r.days.split(',') : [], updatedAt: r.updatedAt };
  });
  const w = readRows('Weeks').filter(function (r) { return r.week === week; })[0];
  return { items: items, flags: flags, week: w ? { status: w.status, orderedAt: w.orderedAt } : null };
}

function tab(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Missing tab "' + name + '". Run setup() in Apps Script first.');
  return sh;
}

function readRows(name) {
  const values = tab(name).getDataRange().getDisplayValues();
  const head = values.shift() || [];
  return values.map(function (row, i) {
    const o = { _row: i + 2 };
    head.forEach(function (k, j) { o[k] = String(row[j] || '').trim(); });
    return o;
  });
}

function writeRow(sh, rowIndex, values) {
  const range = sh.getRange(rowIndex, 1, 1, values.length);
  range.setNumberFormat('@');
  range.setValues([values.map(String)]);
}

function requireWeek(week) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(week || ''))) throw new Error('Bad week');
}
