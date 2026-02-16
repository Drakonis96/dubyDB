const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const multer = require('multer');
const archiver = require('archiver');
const unzipper = require('unzipper');

const app = express();
const PORT = Number(process.env.PORT) || 7192;
const HOST = process.env.HOST || '0.0.0.0';

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'duby.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(DATA_DIR, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

const HEADER_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 65%, #533483 100%)',
  'linear-gradient(135deg, #0b132b 0%, #1c2541 30%, #3a506b 70%, #5bc0be 100%)',
  'linear-gradient(135deg, #1d2b64 0%, #f8cdda 100%)',
  'linear-gradient(135deg, #3b1c32 0%, #402039 35%, #8a3f6f 70%, #de6b8f 100%)',
  'linear-gradient(135deg, #283048 0%, #859398 100%)',
  'linear-gradient(135deg, #0f2027 0%, #203a43 45%, #2c5364 100%)',
];

const TAG_COLORS = ['yellow', 'orange', 'pink', 'red', 'violet', 'green', 'blue', 'gray', 'black', 'purple'];
const PROPERTY_TYPES = new Set(['text', 'singleSelect', 'multiSelect', 'autoId', 'url', 'checkbox', 'date', 'time', 'attachment', 'relation', 'rollup']);
const DEFAULT_APP_SETTINGS = {
  ui: {
    language: 'en',
    theme: 'sepia',
    sidebarCollapsed: false,
  },
  api: {
    enabled: true,
    requireApiKey: false,
    keyEntries: [],
  },
  webhooks: {
    enabled: false,
    timeoutMs: 5000,
    retryCount: 1,
    endpoints: [],
  },
};

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS databases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  api_code TEXT,
  folder_id INTEGER,
  header_image TEXT,
  header_gradient TEXT NOT NULL,
  next_auto_id INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config_json TEXT NOT NULL DEFAULT '{}',
  is_visible INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY(database_id) REFERENCES databases(id) ON DELETE CASCADE,
  UNIQUE(database_id, key)
);

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(database_id) REFERENCES databases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS record_values (
  record_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  value_json TEXT NOT NULL,
  PRIMARY KEY(record_id, property_id),
  FOREIGN KEY(record_id) REFERENCES records(id) ON DELETE CASCADE,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS database_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY(database_id) REFERENCES databases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_id INTEGER NOT NULL,
  record_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(database_id) REFERENCES databases(id) ON DELETE CASCADE,
  FOREIGN KEY(record_id) REFERENCES records(id) ON DELETE CASCADE,
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint_url TEXT NOT NULL,
  event_name TEXT NOT NULL,
  status_code INTEGER,
  ok INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  request_body TEXT,
  response_body TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_databases_folder ON databases(folder_id);
CREATE INDEX IF NOT EXISTS idx_properties_db ON properties(database_id, position);
CREATE INDEX IF NOT EXISTS idx_records_db ON records(database_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_values_property ON record_values(property_id);
CREATE INDEX IF NOT EXISTS idx_attachments_record ON attachments(record_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event_name, created_at DESC);
`);

function ensureViewsPositionColumn() {
  const columns = db.prepare('PRAGMA table_info(database_views)').all();
  const hasPosition = columns.some(column => column.name === 'position');
  if (!hasPosition) {
    db.exec('ALTER TABLE database_views ADD COLUMN position INTEGER NOT NULL DEFAULT 0');
  }

  const databasesWithViews = db.prepare('SELECT DISTINCT database_id FROM database_views').all();
  const updateStmt = db.prepare('UPDATE database_views SET position = ? WHERE id = ?');
  const tx = db.transaction(() => {
    databasesWithViews.forEach(item => {
      const views = db.prepare('SELECT id FROM database_views WHERE database_id = ? ORDER BY position ASC, id ASC').all(item.database_id);
      views.forEach((view, index) => {
        updateStmt.run(index, view.id);
      });
    });
  });
  tx();

  db.exec('CREATE INDEX IF NOT EXISTS idx_views_db_position ON database_views(database_id, position, id)');
}

ensureViewsPositionColumn();

function normalizeDatabaseCode(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 40);
}

function generateDatabaseCode() {
  return `db_${crypto.randomBytes(5).toString('hex')}`;
}

function generateUniqueDatabaseCode() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = normalizeDatabaseCode(generateDatabaseCode());
    if (!candidate) continue;
    const exists = db.prepare('SELECT id FROM databases WHERE api_code = ?').get(candidate);
    if (!exists) return candidate;
  }
  return normalizeDatabaseCode(`db_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`);
}

function ensureDatabaseApiCodeColumn() {
  const columns = db.prepare('PRAGMA table_info(databases)').all();
  const hasApiCode = columns.some(column => column.name === 'api_code');
  if (!hasApiCode) {
    db.exec('ALTER TABLE databases ADD COLUMN api_code TEXT');
  }

  const rows = db.prepare('SELECT id, api_code FROM databases ORDER BY id ASC').all();
  const seen = new Set();
  const updateStmt = db.prepare('UPDATE databases SET api_code = ? WHERE id = ?');
  const tx = db.transaction(() => {
    rows.forEach(row => {
      let code = normalizeDatabaseCode(row.api_code || '');
      if (!code || seen.has(code)) {
        code = generateUniqueDatabaseCode();
      }
      seen.add(code);
      if (String(row.api_code || '') !== code) {
        updateStmt.run(code, row.id);
      }
    });
  });
  tx();

  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_databases_api_code ON databases(api_code)');
}

ensureDatabaseApiCodeColumn();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      const recordId = Number(req.params.recordId || 0);
      const propertyId = Number(req.params.propertyId || 0);
      const dbId = resolveDatabaseIdFromIdentifier(req.params.id);
      const effectiveDbId = dbId || getRecordById(recordId)?.database_id;
      const dir = path.join(UPLOADS_DIR, `db_${effectiveDbId || 'x'}`, `record_${recordId || 'x'}`, `property_${propertyId || 'x'}`);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      cb(null, safeName);
    },
  }),
});

app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(PUBLIC_DIR));

function nowIso() {
  return new Date().toISOString();
}

function parseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return fallback;
  }
}

function deepMerge(base, override) {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? [...override] : [...base];
  }
  if (!base || typeof base !== 'object') {
    return override === undefined ? base : override;
  }
  const result = { ...base };
  Object.keys(override || {}).forEach(key => {
    const current = base[key];
    const next = override[key];
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      result[key] = deepMerge(current, next || {});
    } else if (next !== undefined) {
      result[key] = next;
    }
  });
  return result;
}

function sanitizeWebhookEndpoint(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const url = String(input.url || '').trim();
  if (!url) return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch (_error) {
    return null;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return null;
  return {
    id: String(input.id || `wh_${Date.now()}_${Math.floor(Math.random() * 1000)}`),
    name: String(input.name || parsed.host || parsed.hostname || 'Webhook').trim() || 'Webhook',
    url: parsed.toString(),
    active: input.active !== false,
    events: Array.isArray(input.events)
      ? [...new Set(input.events.map(item => String(item || '').trim()).filter(Boolean))]
      : [],
    secret: String(input.secret || '').trim() || null,
    headers: input.headers && typeof input.headers === 'object' && !Array.isArray(input.headers)
      ? Object.fromEntries(Object.entries(input.headers)
        .map(([key, value]) => [String(key).trim(), String(value || '').trim()])
        .filter(([key]) => key))
      : {},
  };
}

function sanitizeApiKeyEntry(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const id = String(input.id || '').trim();
  const prefix = String(input.prefix || '').trim();
  const salt = String(input.salt || '').trim().toLowerCase();
  const hash = String(input.hash || '').trim().toLowerCase();
  const createdAt = String(input.createdAt || '').trim();
  const revokedAtRaw = input.revokedAt == null ? null : String(input.revokedAt).trim();
  const label = String(input.label || '').trim() || null;

  if (!id) return null;
  if (!prefix) return null;
  if (!/^[a-f0-9]{32}$/i.test(salt)) return null;
  if (!/^[a-f0-9]{64}$/i.test(hash)) return null;
  if (!createdAt) return null;

  return {
    id,
    prefix,
    salt,
    hash,
    createdAt,
    revokedAt: revokedAtRaw || null,
    label,
  };
}

function hashApiKey(value, salt) {
  return crypto
    .createHash('sha256')
    .update(`${String(salt)}:${String(value)}`)
    .digest('hex');
}

function createApiKeyEntry(label = null) {
  const id = `key_${crypto.randomBytes(8).toString('hex')}`;
  const secretPart = crypto.randomBytes(24).toString('base64url');
  const key = `duby_${secretPart}`;
  const prefix = key.slice(0, 12);
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashApiKey(key, salt);
  return {
    key,
    entry: {
      id,
      prefix,
      salt,
      hash,
      createdAt: nowIso(),
      revokedAt: null,
      label: label ? String(label).trim().slice(0, 120) : null,
    },
  };
}

function countActiveApiKeys(apiSettings) {
  const entries = Array.isArray(apiSettings?.keyEntries) ? apiSettings.keyEntries : [];
  return entries.filter(item => !item.revokedAt).length;
}

function toPublicAppSettings(settings) {
  const safe = settings || getAppSettings();
  const entries = Array.isArray(safe.api?.keyEntries) ? safe.api.keyEntries : [];
  const keyItems = entries.map(item => ({
    id: item.id,
    prefix: item.prefix,
    createdAt: item.createdAt,
    revokedAt: item.revokedAt,
    active: !item.revokedAt,
    label: item.label || null,
  }));
  return {
    ...safe,
    api: {
      enabled: safe.api.enabled,
      requireApiKey: safe.api.requireApiKey,
      keyCount: keyItems.filter(item => item.active).length,
      keys: keyItems,
    },
  };
}

function findMatchingApiKeyEntry(settings, incomingKey) {
  if (!incomingKey) return null;
  const entries = Array.isArray(settings?.api?.keyEntries) ? settings.api.keyEntries : [];
  for (const entry of entries) {
    if (entry.revokedAt) continue;
    const incomingHash = hashApiKey(incomingKey, entry.salt);
    const expected = Buffer.from(entry.hash, 'hex');
    const actual = Buffer.from(incomingHash, 'hex');
    if (expected.length !== actual.length) continue;
    if (crypto.timingSafeEqual(expected, actual)) {
      return entry;
    }
  }
  return null;
}

function sanitizeAppSettings(raw) {
  const merged = deepMerge(DEFAULT_APP_SETTINGS, raw || {});
  const language = String(merged.ui?.language || '').toLowerCase() === 'es' ? 'es' : 'en';
  const theme = ['white', 'dark', 'sepia'].includes(String(merged.ui?.theme || '').toLowerCase())
    ? String(merged.ui.theme).toLowerCase()
    : 'sepia';
  const sidebarCollapsed = Boolean(merged.ui?.sidebarCollapsed);
  const keyEntries = Array.isArray(merged.api?.keyEntries)
    ? merged.api.keyEntries.map(sanitizeApiKeyEntry).filter(Boolean)
    : [];
  const endpoints = Array.isArray(merged.webhooks?.endpoints)
    ? merged.webhooks.endpoints.map(sanitizeWebhookEndpoint).filter(Boolean)
    : [];

  return {
    ui: {
      language,
      theme,
      sidebarCollapsed,
    },
    api: {
      enabled: merged.api?.enabled !== false,
      requireApiKey: Boolean(merged.api?.requireApiKey),
      keyEntries,
    },
    webhooks: {
      enabled: Boolean(merged.webhooks?.enabled),
      timeoutMs: Math.min(30000, Math.max(500, Number(merged.webhooks?.timeoutMs || 5000))),
      retryCount: Math.min(3, Math.max(0, Number(merged.webhooks?.retryCount || 1))),
      endpoints,
    },
  };
}

function getStoredSettingsRaw() {
  const row = db.prepare('SELECT value_json FROM app_settings WHERE key = ?').get('global');
  return parseJson(row?.value_json || '{}', {});
}

function getAppSettings() {
  return sanitizeAppSettings(getStoredSettingsRaw());
}

function saveAppSettings(nextRaw) {
  const next = sanitizeAppSettings(nextRaw);
  const ts = nowIso();
  db.prepare(`
    INSERT INTO app_settings(key, value_json, updated_at)
    VALUES('global', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run(JSON.stringify(next), ts);
  return next;
}

if (!db.prepare('SELECT key FROM app_settings WHERE key = ?').get('global')) {
  saveAppSettings(DEFAULT_APP_SETTINGS);
}

function migrateLegacyApiKeysIfNeeded() {
  const raw = getStoredSettingsRaw();
  const legacyKeys = Array.isArray(raw?.api?.keys)
    ? raw.api.keys.map(item => String(item || '').trim()).filter(Boolean)
    : [];
  const hasCurrentEntries = Array.isArray(raw?.api?.keyEntries) && raw.api.keyEntries.length > 0;
  if (!legacyKeys.length || hasCurrentEntries) return;

  const migratedEntries = legacyKeys.map(value => {
    const salt = crypto.randomBytes(16).toString('hex');
    return {
      id: `key_${crypto.randomBytes(8).toString('hex')}`,
      prefix: String(value).slice(0, 12) || 'duby_legacy',
      salt,
      hash: hashApiKey(value, salt),
      createdAt: nowIso(),
      revokedAt: null,
      label: 'legacy',
    };
  });

  const nextRaw = {
    ...raw,
    api: {
      ...(raw.api && typeof raw.api === 'object' ? raw.api : {}),
      keys: [],
      keyEntries: migratedEntries,
    },
  };
  saveAppSettings(nextRaw);
}

migrateLegacyApiKeysIfNeeded();

function resolveApiKey(req) {
  const headerKey = String(req.get('x-api-key') || '').trim();
  if (headerKey) return headerKey;
  const auth = String(req.get('authorization') || '').trim();
  if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
  return '';
}

function apiGuardMiddleware(req, res, next) {
  const settings = getAppSettings();
  if (!settings.api.enabled) {
    return res.status(503).json({ error: 'API deshabilitada por configuración' });
  }

  if (!settings.api.requireApiKey) return next();
  if (!countActiveApiKeys(settings.api)) {
    return res.status(503).json({ error: 'API key requerida pero no hay claves configuradas' });
  }

  const incomingKey = resolveApiKey(req);
  if (!findMatchingApiKeyEntry(settings, incomingKey)) {
    return res.status(401).json({ error: 'API key inválida' });
  }
  return next();
}

app.use('/api', apiGuardMiddleware);

function insertWebhookDeliveryLog(entry) {
  db.prepare(`
    INSERT INTO webhook_deliveries(endpoint_url, event_name, status_code, ok, duration_ms, error_message, request_body, response_body, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.endpointUrl,
    entry.eventName,
    entry.statusCode || null,
    entry.ok ? 1 : 0,
    Number(entry.durationMs || 0),
    entry.errorMessage || null,
    entry.requestBody || null,
    entry.responseBody || null,
    nowIso(),
  );
}

async function postWebhook(endpoint, eventName, body, timeoutMs, retries) {
  const headers = {
    'content-type': 'application/json',
    'x-dubydb-event': eventName,
    ...endpoint.headers,
  };

  const payloadText = JSON.stringify(body);
  if (endpoint.secret) {
    headers['x-dubydb-signature'] = crypto
      .createHmac('sha256', endpoint.secret)
      .update(payloadText)
      .digest('hex');
  }

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: payloadText,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const responseText = await response.text();
      const ok = response.ok;
      insertWebhookDeliveryLog({
        endpointUrl: endpoint.url,
        eventName,
        statusCode: response.status,
        ok,
        durationMs: Date.now() - started,
        requestBody: payloadText,
        responseBody: responseText.slice(0, 2000),
      });
      if (ok) return;
      lastError = new Error(`Webhook respondió ${response.status}`);
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      insertWebhookDeliveryLog({
        endpointUrl: endpoint.url,
        eventName,
        statusCode: null,
        ok: false,
        durationMs: Date.now() - started,
        errorMessage: String(error.message || error).slice(0, 1000),
        requestBody: payloadText,
        responseBody: null,
      });
    }
  }

  if (lastError) {
    console.warn('[WEBHOOK]', eventName, 'falló:', lastError.message);
  }
}

function emitWebhookEvent(eventName, payload) {
  const settings = getAppSettings();
  if (!settings.webhooks.enabled) return;

  const endpoints = settings.webhooks.endpoints.filter(endpoint => {
    if (!endpoint.active) return false;
    if (!endpoint.events.length) return true;
    return endpoint.events.includes(eventName);
  });

  if (!endpoints.length) return;

  const body = {
    event: eventName,
    timestamp: nowIso(),
    payload,
  };

  endpoints.forEach(endpoint => {
    postWebhook(
      endpoint,
      eventName,
      body,
      settings.webhooks.timeoutMs,
      settings.webhooks.retryCount,
    ).catch(error => {
      console.warn('[WEBHOOK]', eventName, endpoint.url, error.message);
    });
  });
}

function randomGradient() {
  return HEADER_GRADIENTS[Math.floor(Math.random() * HEADER_GRADIENTS.length)];
}

function normalizeKey(name) {
  return String(name || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || `prop_${Date.now()}`;
}

function ensureType(type) {
  if (!PROPERTY_TYPES.has(type)) {
    const error = new Error(`Tipo de propiedad no soportado: ${type}`);
    error.status = 400;
    throw error;
  }
}

function listProperties(databaseId) {
  return db.prepare(`
    SELECT id, database_id, key, name, type, config_json, is_visible, position, created_at
    FROM properties
    WHERE database_id = ?
    ORDER BY position ASC, id ASC
  `).all(databaseId).map(prop => ({
    ...prop,
    is_visible: Boolean(prop.is_visible),
    config: parseJson(prop.config_json, {}),
  }));
}

function listViews(databaseId) {
  return db.prepare(`
    SELECT id, database_id, name, type, position, config_json, created_at
    FROM database_views
    WHERE database_id = ?
    ORDER BY position ASC, id ASC
  `).all(databaseId).map(view => ({
    ...view,
    config: parseJson(view.config_json, {}),
  }));
}

function getDatabase(databaseId) {
  return db.prepare(`
    SELECT id, name, api_code, folder_id, header_image, header_gradient, created_at, updated_at, next_auto_id
    FROM databases
    WHERE id = ?
  `).get(databaseId);
}

function getDatabaseByCode(databaseCode) {
  const code = normalizeDatabaseCode(databaseCode);
  if (!code) return null;
  return db.prepare(`
    SELECT id, name, api_code, folder_id, header_image, header_gradient, created_at, updated_at, next_auto_id
    FROM databases
    WHERE api_code = ?
  `).get(code);
}

function resolveDatabaseRowIdentifier(identifier) {
  const raw = String(identifier || '').trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return getDatabase(Number(raw));
  return getDatabaseByCode(raw);
}

function resolveDatabaseIdFromIdentifier(identifier) {
  const row = resolveDatabaseRowIdentifier(identifier);
  return row ? Number(row.id) : 0;
}

function getRecordById(recordId) {
  return db.prepare('SELECT id, database_id, created_at, updated_at FROM records WHERE id = ?').get(recordId);
}

function listAttachmentsByRecord(recordIds) {
  if (!recordIds.length) return [];
  const placeholders = recordIds.map(() => '?').join(',');
  return db.prepare(`
    SELECT id, database_id, record_id, property_id, file_name, storage_path, mime_type, size_bytes, created_at
    FROM attachments
    WHERE record_id IN (${placeholders})
    ORDER BY id ASC
  `).all(...recordIds).map(row => ({
    ...row,
    url: `/uploads/${row.storage_path}`,
  }));
}

function loadRecordRows(databaseId) {
  const records = db.prepare('SELECT id, database_id, created_at, updated_at FROM records WHERE database_id = ? ORDER BY id DESC').all(databaseId);
  const values = db.prepare(`
    SELECT rv.record_id, rv.property_id, rv.value_json
    FROM record_values rv
    INNER JOIN properties p ON p.id = rv.property_id
    WHERE p.database_id = ?
  `).all(databaseId);

  const map = new Map(records.map(r => [r.id, {
    id: r.id,
    databaseId: r.database_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    values: {},
  }]));

  values.forEach(row => {
    const target = map.get(row.record_id);
    if (!target) return;
    target.values[row.property_id] = parseJson(row.value_json, null);
  });

  const attachments = listAttachmentsByRecord(records.map(r => r.id));
  attachments.forEach(file => {
    const target = map.get(file.record_id);
    if (!target) return;
    if (!target.attachments) target.attachments = {};
    if (!target.attachments[file.property_id]) target.attachments[file.property_id] = [];
    target.attachments[file.property_id].push(file);
  });

  return [...map.values()];
}

function getRecordLabel(databaseId, recordId) {
  const props = listProperties(databaseId);
  const firstTextProp = props.find(p => p.type === 'text') || props.find(p => p.type === 'autoId') || props[0];
  if (!firstTextProp) return `Registro ${recordId}`;
  const valueRow = db.prepare('SELECT value_json FROM record_values WHERE record_id = ? AND property_id = ?').get(recordId, firstTextProp.id);
  if (!valueRow) return `Registro ${recordId}`;
  const value = parseJson(valueRow.value_json, null);
  if (value === null || value === undefined || value === '') return `Registro ${recordId}`;
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function getRelationTargetDatabaseIds(config = {}) {
  const single = Number(config.relatedDatabaseId || 0);
  if (single) return [single];
  const multi = Array.isArray(config.relatedDatabaseIds)
    ? [...new Set(config.relatedDatabaseIds.map(v => Number(v)).filter(Boolean))]
    : [];
  return multi;
}

function normalizeRelationValue(prop, rawValue) {
  const targetDbIds = getRelationTargetDatabaseIds(prop.config || {});
  const nextIds = [...new Set((Array.isArray(rawValue) ? rawValue : []).map(v => Number(v)).filter(Boolean))];
  if (!nextIds.length || !targetDbIds.length) return [];

  const recordPlaceholders = nextIds.map(() => '?').join(',');
  const dbPlaceholders = targetDbIds.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT id
    FROM records
    WHERE id IN (${recordPlaceholders})
      AND database_id IN (${dbPlaceholders})
  `).all(...nextIds, ...targetDbIds);

  const allowed = new Set(rows.map(row => Number(row.id)));
  return nextIds.filter(id => allowed.has(id));
}

function syncReciprocalRelationLinks({ relationProp, recordId, prevIds, nextIds }) {
  const cfg = relationProp.config || {};
  const reciprocalPropertyId = Number(cfg.reciprocalPropertyId || 0);
  if (!reciprocalPropertyId) return;

  const reciprocalProp = db.prepare('SELECT id, type FROM properties WHERE id = ?').get(reciprocalPropertyId);
  if (!reciprocalProp || reciprocalProp.type !== 'relation') return;

  const previousSet = new Set((prevIds || []).map(Number).filter(Boolean));
  const nextSet = new Set((nextIds || []).map(Number).filter(Boolean));

  const upsertValue = db.prepare(`
    INSERT INTO record_values(record_id, property_id, value_json)
    VALUES(?, ?, ?)
    ON CONFLICT(record_id, property_id) DO UPDATE SET value_json = excluded.value_json
  `);

  const touchedRelatedIds = [...new Set([...previousSet, ...nextSet])];
  touchedRelatedIds.forEach(relatedRecordId => {
    const relatedExists = db.prepare('SELECT id FROM records WHERE id = ?').get(relatedRecordId);
    if (!relatedExists) return;

    const currentRow = db.prepare('SELECT value_json FROM record_values WHERE record_id = ? AND property_id = ?').get(relatedRecordId, reciprocalPropertyId);
    const currentIds = parseJson(currentRow?.value_json || '[]', []);
    const list = Array.isArray(currentIds) ? currentIds.map(v => Number(v)).filter(Boolean) : [];
    const set = new Set(list);

    if (nextSet.has(relatedRecordId)) set.add(recordId);
    else set.delete(recordId);

    upsertValue.run(relatedRecordId, reciprocalPropertyId, JSON.stringify([...set]));
  });
}

function applyRollups(databaseId, rows) {
  const props = listProperties(databaseId);
  const propById = new Map(props.map(p => [p.id, p]));
  const rollups = props.filter(p => p.type === 'rollup');

  rows.forEach(row => {
    rollups.forEach(rollup => {
      const cfg = rollup.config || {};
      const relationPropertyId = Number(cfg.relationPropertyId || 0);
      const relatedPropertyId = Number(cfg.relatedPropertyId || 0);
      const relationProp = propById.get(relationPropertyId);
      if (!relationProp || relationProp.type !== 'relation' || !relatedPropertyId) {
        row.values[rollup.id] = [];
        return;
      }

      const relatedRecordIds = row.values[relationProp.id];
      if (!Array.isArray(relatedRecordIds) || relatedRecordIds.length === 0) {
        row.values[rollup.id] = [];
        return;
      }

      const placeholders = relatedRecordIds.map(() => '?').join(',');
      const rowsRelated = db.prepare(`
        SELECT record_id, value_json
        FROM record_values
        WHERE property_id = ? AND record_id IN (${placeholders})
      `).all(relatedPropertyId, ...relatedRecordIds);

      const values = [];
      let emptyCount = 0;
      rowsRelated.forEach(rel => {
        const parsed = parseJson(rel.value_json, null);
        if (Array.isArray(parsed)) {
          if (!parsed.length) emptyCount += 1;
          values.push(...parsed);
        } else if (parsed !== null && parsed !== undefined && parsed !== '') {
          values.push(parsed);
        } else {
          emptyCount += 1;
        }
      });

      const calc = String(cfg.calculate || 'showOriginal');
      if (calc === 'countAll') {
        row.values[rollup.id] = values.length;
        return;
      }
      if (calc === 'countValues') {
        row.values[rollup.id] = values.filter(v => v !== null && v !== undefined && String(v) !== '').length;
        return;
      }
      if (calc === 'countUniqueValues') {
        row.values[rollup.id] = [...new Set(values.map(v => JSON.stringify(v)))].length;
        return;
      }
      if (calc === 'sum' || calc === 'avg' || calc === 'min' || calc === 'max') {
        const nums = values.map(v => Number(v)).filter(v => Number.isFinite(v));
        if (!nums.length) {
          row.values[rollup.id] = 0;
          return;
        }
        if (calc === 'sum') row.values[rollup.id] = nums.reduce((acc, v) => acc + v, 0);
        if (calc === 'avg') row.values[rollup.id] = nums.reduce((acc, v) => acc + v, 0) / nums.length;
        if (calc === 'min') row.values[rollup.id] = Math.min(...nums);
        if (calc === 'max') row.values[rollup.id] = Math.max(...nums);
        return;
      }
      if (calc === 'percentEmpty' || calc === 'percentNotEmpty') {
        const totalRelated = Math.max(relatedRecordIds.length, 1);
        const notEmpty = Math.max(0, relatedRecordIds.length - emptyCount);
        const percent = calc === 'percentEmpty'
          ? (emptyCount / totalRelated) * 100
          : (notEmpty / totalRelated) * 100;
        row.values[rollup.id] = Number(percent.toFixed(2));
        return;
      }
      row.values[rollup.id] = values;
    });
  });
}

function propertyValueByKey(record, prop) {
  const value = record.values[prop.id];
  if (prop.type === 'attachment') {
    const files = (record.attachments && record.attachments[prop.id]) || [];
    return files.map(file => file.url);
  }
  return value;
}

function toRenderableRecord(databaseId, record, props) {
  const obj = {
    id: record.id,
    databaseId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    values: {},
    attachments: record.attachments || {},
  };

  props.forEach(prop => {
    obj.values[prop.key] = propertyValueByKey(record, prop);
  });

  return obj;
}

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
}

function filterRecord(renderRecord, filters, props) {
  if (!Array.isArray(filters) || !filters.length) return true;

  const propById = new Map(props.map(p => [p.id, p]));

  return filters.every(filter => {
    const prop = propById.get(Number(filter.propertyId));
    if (!prop) return true;

    const raw = renderRecord.values[prop.key];
    const value = Array.isArray(raw) ? raw : [raw];
    const normalized = value.map(v => (v === null || v === undefined) ? '' : String(v).toLowerCase());
    const target = String(filter.value ?? '').toLowerCase();

    switch (filter.operator) {
      case 'equals': return normalized.some(v => v === target);
      case 'notEquals': return normalized.every(v => v !== target);
      case 'contains': return normalized.some(v => v.includes(target));
      case 'notContains': return normalized.every(v => !v.includes(target));
      case 'isEmpty': return normalized.every(v => v === '');
      case 'isNotEmpty': return normalized.some(v => v !== '');
      case 'checked': return Boolean(raw) === true;
      case 'unchecked': return Boolean(raw) === false;
      case 'before': return String(raw || '') < String(filter.value || '');
      case 'after': return String(raw || '') > String(filter.value || '');
      default: return true;
    }
  });
}

function computeChart(databaseId, config = {}) {
  const props = listProperties(databaseId);
  const rows = loadRecordRows(databaseId);
  applyRollups(databaseId, rows);
  const records = rows.map(row => toRenderableRecord(databaseId, row, props));

  const xProp = props.find(p => p.id === Number(config.xPropertyId));
  const yProp = props.find(p => p.id === Number(config.yPropertyId));
  if (!xProp) return { labels: [], datasets: [] };

  const groups = new Map();

  records.forEach(record => {
    const keyVal = record.values[xProp.key];
    const key = Array.isArray(keyVal) ? (keyVal[0] || '-') : (keyVal || '-');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  });

  const labels = [...groups.keys()].sort((a, b) => compareValues(a, b));
  const aggregation = config.aggregation || 'count';

  const data = labels.map(label => {
    const bucket = groups.get(label) || [];
    if (!yProp || aggregation === 'count') return bucket.length;
    const values = bucket
      .map(item => Number(item.values[yProp.key]))
      .filter(v => Number.isFinite(v));
    if (!values.length) return 0;
    if (aggregation === 'sum') return values.reduce((acc, v) => acc + v, 0);
    if (aggregation === 'avg') return values.reduce((acc, v) => acc + v, 0) / values.length;
    if (aggregation === 'max') return Math.max(...values);
    if (aggregation === 'min') return Math.min(...values);
    return bucket.length;
  });

  return {
    labels,
    datasets: [{
      label: config.title || `${xProp.name} (${aggregation})`,
      data,
    }],
  };
}

function computeChiSquare(databaseId, propAId, propBId) {
  const props = listProperties(databaseId);
  const rows = loadRecordRows(databaseId);
  applyRollups(databaseId, rows);
  const records = rows.map(row => toRenderableRecord(databaseId, row, props));

  const a = props.find(p => p.id === Number(propAId));
  const b = props.find(p => p.id === Number(propBId));
  if (!a || !b) return null;

  const aValues = new Set();
  const bValues = new Set();
  const counts = new Map();

  records.forEach(record => {
    const av = Array.isArray(record.values[a.key]) ? record.values[a.key][0] : record.values[a.key];
    const bv = Array.isArray(record.values[b.key]) ? record.values[b.key][0] : record.values[b.key];
    if (!av || !bv) return;
    aValues.add(String(av));
    bValues.add(String(bv));
    const key = `${av}|||${bv}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const rowsArr = [...aValues];
  const colsArr = [...bValues];
  if (rowsArr.length < 2 || colsArr.length < 2) return null;

  const matrix = rowsArr.map(r => colsArr.map(c => counts.get(`${r}|||${c}`) || 0));
  const rowTotals = matrix.map(row => row.reduce((acc, v) => acc + v, 0));
  const colTotals = colsArr.map((_, j) => matrix.reduce((acc, row) => acc + row[j], 0));
  const n = rowTotals.reduce((acc, v) => acc + v, 0);
  if (!n) return null;

  let chi2 = 0;
  for (let i = 0; i < rowsArr.length; i += 1) {
    for (let j = 0; j < colsArr.length; j += 1) {
      const expected = (rowTotals[i] * colTotals[j]) / n;
      if (expected <= 0) continue;
      const diff = matrix[i][j] - expected;
      chi2 += (diff * diff) / expected;
    }
  }

  const df = (rowsArr.length - 1) * (colsArr.length - 1);
  return {
    rows: rowsArr,
    cols: colsArr,
    matrix,
    statistic: Number(chi2.toFixed(6)),
    degreesOfFreedom: df,
  };
}

function sanitizePropertyConfig(type, config) {
  const next = { ...(config || {}) };
  if (type === 'singleSelect' || type === 'multiSelect') {
    const options = Array.isArray(next.options) ? next.options : [];
    next.options = options.map(option => ({
      label: String(option.label || '').trim(),
      color: TAG_COLORS.includes(String(option.color || '').toLowerCase())
        ? String(option.color).toLowerCase()
        : 'gray',
    })).filter(option => option.label);
  }

  if (type === 'relation') {
    next.relatedDatabaseIds = Array.isArray(next.relatedDatabaseIds)
      ? [...new Set(next.relatedDatabaseIds.map(v => Number(v)).filter(Boolean))]
      : [];
    next.relatedDatabaseId = Number(next.relatedDatabaseId || next.relatedDatabaseIds[0] || 0) || null;
    if (next.relatedDatabaseId) {
      next.relatedDatabaseIds = [next.relatedDatabaseId];
    }
    next.showOnRelatedDatabase = Boolean(next.showOnRelatedDatabase);
    next.reciprocalPropertyId = Number(next.reciprocalPropertyId || 0) || null;
    next.reciprocalPropertyName = String(next.reciprocalPropertyName || '').trim() || null;
  }

  if (type === 'rollup') {
    next.relationPropertyId = Number(next.relationPropertyId || 0) || null;
    next.relatedPropertyId = Number(next.relatedPropertyId || 0) || null;
    next.calculate = String(next.calculate || 'showOriginal');
  }

  return next;
}

function getPropertyOptions(databaseId, property) {
  if (property.type === 'singleSelect' || property.type === 'multiSelect') {
    const cfg = property.config || {};
    const options = (Array.isArray(cfg.options) ? cfg.options : [])
      .map(option => ({
        label: String(option?.label || '').trim(),
        color: String(option?.color || 'gray').trim() || 'gray',
      }))
      .filter(option => option.label);

    const seen = new Set(options.map(option => option.label.toLowerCase()));
    const rows = db.prepare(`
      SELECT value_json FROM record_values rv
      INNER JOIN records r ON r.id = rv.record_id
      WHERE r.database_id = ? AND rv.property_id = ?
    `).all(databaseId, property.id);

    rows.forEach(row => {
      const parsed = parseJson(row.value_json, null);
      const values = Array.isArray(parsed) ? parsed : [parsed];
      values.forEach(raw => {
        const label = String(raw || '').trim();
        if (!label) return;
        const key = label.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        options.push({ label, color: 'gray' });
      });
    });

    const mode = String(cfg.optionSort || 'manual').toLowerCase();
    if (mode === 'asc' || mode === 'desc') {
      options.sort((a, b) => {
        const cmp = String(a?.label || '').localeCompare(String(b?.label || ''), 'es', { sensitivity: 'base' });
        return mode === 'asc' ? cmp : -cmp;
      });
    }
    return options;
  }

  const values = new Set();
  const rows = db.prepare(`
    SELECT value_json FROM record_values rv
    INNER JOIN records r ON r.id = rv.record_id
    WHERE r.database_id = ? AND rv.property_id = ?
  `).all(databaseId, property.id);

  rows.forEach(row => {
    const parsed = parseJson(row.value_json, null);
    if (Array.isArray(parsed)) {
      parsed.forEach(item => item && values.add(String(item)));
    } else if (parsed !== null && parsed !== undefined && parsed !== '') {
      values.add(String(parsed));
    }
  });

  return [...values].sort((a, b) => a.localeCompare(b, 'es'));
}

const createDatabaseTx = db.transaction((name, folderId) => {
  const ts = nowIso();
  const apiCode = generateUniqueDatabaseCode();
  const insertDb = db.prepare(`
    INSERT INTO databases(name, api_code, folder_id, header_gradient, created_at, updated_at)
    VALUES(?, ?, ?, ?, ?, ?)
  `);
  const result = insertDb.run(name, apiCode, folderId || null, randomGradient(), ts, ts);
  const databaseId = Number(result.lastInsertRowid);

  const insertProperty = db.prepare(`
    INSERT INTO properties(database_id, key, name, type, config_json, is_visible, position, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProperty.run(databaseId, 'id', 'ID', 'autoId', '{}', 1, 0, ts);
  insertProperty.run(databaseId, 'titulo', 'Título', 'text', '{}', 1, 1, ts);

  const insertView = db.prepare(`
    INSERT INTO database_views(database_id, name, type, position, config_json, created_at)
    VALUES(?, ?, ?, ?, ?, ?)
  `);

  insertView.run(databaseId, 'Tabla', 'table', 0, '{}', ts);
  insertView.run(databaseId, 'Galería', 'gallery', 1, '{}', ts);
  insertView.run(databaseId, 'Análisis', 'analysis', 2, '{}', ts);

  return databaseId;
});

function deleteFolderRecursive(folderId) {
  const childFolders = db.prepare('SELECT id FROM folders WHERE parent_id = ?').all(folderId);
  childFolders.forEach(child => deleteFolderRecursive(child.id));
  db.prepare('UPDATE databases SET folder_id = NULL, updated_at = ? WHERE folder_id = ?').run(nowIso(), folderId);
  db.prepare('DELETE FROM folders WHERE id = ?').run(folderId);
}

function wouldCreateFolderCycle(folderId, nextParentId) {
  let currentParentId = Number(nextParentId || 0) || null;

  while (currentParentId) {
    if (currentParentId === folderId) return true;
    const parentRow = db.prepare('SELECT parent_id FROM folders WHERE id = ?').get(currentParentId);
    if (!parentRow) break;
    currentParentId = Number(parentRow.parent_id || 0) || null;
  }

  return false;
}

app.get('/api/bootstrap', (_req, res) => {
  const folders = db.prepare('SELECT id, name, parent_id, created_at FROM folders ORDER BY name COLLATE NOCASE ASC').all();
  const databases = db.prepare(`
    SELECT d.id, d.name, d.api_code, d.folder_id, d.header_image, d.header_gradient, d.created_at, d.updated_at,
      COUNT(r.id) AS record_count
    FROM databases d
    LEFT JOIN records r ON r.database_id = d.id
    GROUP BY d.id
    ORDER BY d.updated_at DESC
  `).all();

  res.json({ folders, databases, settings: toPublicAppSettings(getAppSettings()) });
});

app.get('/api/settings', (_req, res) => {
  const settings = toPublicAppSettings(getAppSettings());
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const current = getAppSettings();
  const incoming = req.body && typeof req.body === 'object' ? req.body : {};
  const merged = deepMerge(current, incoming);
  const next = saveAppSettings(merged);
  emitWebhookEvent('settings.updated', {
    scope: 'global',
    api: {
      enabled: next.api.enabled,
      requireApiKey: next.api.requireApiKey,
      keyCount: countActiveApiKeys(next.api),
    },
    webhooks: {
      enabled: next.webhooks.enabled,
      endpointCount: next.webhooks.endpoints.length,
    },
  });
  res.json(toPublicAppSettings(next));
});

app.get('/api/settings/api-keys', (_req, res) => {
  const settings = getAppSettings();
  const keys = toPublicAppSettings(settings).api.keys;
  res.json({ keys, requireApiKey: settings.api.requireApiKey, enabled: settings.api.enabled });
});

app.post('/api/settings/api-keys', (req, res) => {
  const settings = getAppSettings();
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const label = body.label ? String(body.label).trim() : null;
  const created = createApiKeyEntry(label);
  const nextRaw = {
    ...settings,
    api: {
      ...settings.api,
      keyEntries: [...settings.api.keyEntries, created.entry],
    },
  };

  const next = saveAppSettings(nextRaw);
  emitWebhookEvent('settings.api_key.created', {
    keyId: created.entry.id,
    prefix: created.entry.prefix,
    activeKeyCount: countActiveApiKeys(next.api),
  });

  res.status(201).json({
    id: created.entry.id,
    prefix: created.entry.prefix,
    key: created.key,
    createdAt: created.entry.createdAt,
    label: created.entry.label,
  });
});

app.delete('/api/settings/api-keys/:id', (req, res) => {
  const keyId = String(req.params.id || '').trim();
  if (!keyId) return res.status(400).json({ error: 'ID de clave inválido' });

  const settings = getAppSettings();
  const entries = Array.isArray(settings.api?.keyEntries) ? settings.api.keyEntries : [];
  const index = entries.findIndex(item => item.id === keyId);
  if (index < 0) return res.status(404).json({ error: 'Clave no encontrada' });
  if (entries[index].revokedAt) return res.json({ ok: true, alreadyRevoked: true });

  const ts = nowIso();
  const updatedEntries = [...entries];
  updatedEntries[index] = {
    ...updatedEntries[index],
    revokedAt: ts,
  };

  const nextRaw = {
    ...settings,
    api: {
      ...settings.api,
      keyEntries: updatedEntries,
    },
  };

  const next = saveAppSettings(nextRaw);
  emitWebhookEvent('settings.api_key.revoked', {
    keyId,
    activeKeyCount: countActiveApiKeys(next.api),
  });

  res.json({ ok: true });
});

app.post('/api/settings/webhooks/test', (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const endpoint = sanitizeWebhookEndpoint(body.endpoint || body);
  if (!endpoint) return res.status(400).json({ error: 'Endpoint de webhook inválido' });

  const payload = {
    event: 'webhook.test',
    timestamp: nowIso(),
    payload: {
      message: 'Webhook de prueba dubyDB',
      source: 'manual-test',
    },
  };

  postWebhook(
    endpoint,
    'webhook.test',
    payload,
    Math.min(15000, Math.max(500, Number(body.timeoutMs || 5000))),
    0,
  ).catch(error => {
    console.warn('[WEBHOOK TEST]', error.message);
  });

  res.json({ ok: true, queued: true });
});

app.get('/api/webhooks/deliveries', (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit || 100)));
  const event = String(req.query.event || '').trim();

  const rows = event
    ? db.prepare(`
      SELECT id, endpoint_url, event_name, status_code, ok, duration_ms, error_message, response_body, created_at
      FROM webhook_deliveries
      WHERE event_name = ?
      ORDER BY id DESC
      LIMIT ?
    `).all(event, limit)
    : db.prepare(`
      SELECT id, endpoint_url, event_name, status_code, ok, duration_ms, error_message, response_body, created_at
      FROM webhook_deliveries
      ORDER BY id DESC
      LIMIT ?
    `).all(limit);

  res.json(rows.map(row => ({
    ...row,
    ok: Boolean(row.ok),
  })));
});

app.get('/api/folders', (_req, res) => {
  const rows = db.prepare('SELECT id, name, parent_id, created_at FROM folders ORDER BY name COLLATE NOCASE ASC').all();
  res.json(rows);
});

app.post('/api/folders', (req, res) => {
  const { name, parentId = null } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'El nombre de carpeta es obligatorio' });
  }

  const ts = nowIso();
  const result = db.prepare('INSERT INTO folders(name, parent_id, created_at) VALUES(?, ?, ?)').run(String(name).trim(), parentId || null, ts);
  const created = { id: Number(result.lastInsertRowid), name: String(name).trim(), parent_id: parentId || null, created_at: ts };
  emitWebhookEvent('folder.created', created);
  return res.status(201).json(created);
});

app.put('/api/folders/:id', (req, res) => {
  const folderId = Number(req.params.id);
  const current = db.prepare('SELECT id, name, parent_id, created_at FROM folders WHERE id = ?').get(folderId);
  if (!current) return res.status(404).json({ error: 'Carpeta no encontrada' });

  const payload = req.body || {};
  const name = payload.name === undefined ? current.name : String(payload.name || '').trim();
  if (!name) return res.status(400).json({ error: 'El nombre de carpeta es obligatorio' });

  const parentId = payload.parentId === undefined
    ? (Number(current.parent_id || 0) || null)
    : (Number(payload.parentId || 0) || null);

  if (parentId === folderId) {
    return res.status(400).json({ error: 'Una carpeta no puede ser su propia carpeta padre' });
  }

  if (parentId) {
    const parentRow = db.prepare('SELECT id FROM folders WHERE id = ?').get(parentId);
    if (!parentRow) return res.status(404).json({ error: 'Carpeta padre no encontrada' });
    if (wouldCreateFolderCycle(folderId, parentId)) {
      return res.status(400).json({ error: 'Movimiento inválido: se crea una referencia circular' });
    }
  }

  db.prepare('UPDATE folders SET name = ?, parent_id = ? WHERE id = ?').run(name, parentId, folderId);

  const updated = {
    id: folderId,
    name,
    parent_id: parentId,
    created_at: current.created_at,
  };

  emitWebhookEvent('folder.updated', updated);
  res.json(updated);
});

app.delete('/api/folders/:id', (req, res) => {
  const folderId = Number(req.params.id);
  const row = db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId);
  if (!row) return res.status(404).json({ error: 'Carpeta no encontrada' });

  const tx = db.transaction(() => deleteFolderRecursive(folderId));
  tx();
  emitWebhookEvent('folder.deleted', { id: folderId });
  res.json({ ok: true });
});

app.get('/api/databases', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const folderId = req.query.folderId ? Number(req.query.folderId) : null;

  const rows = db.prepare(`
    SELECT d.id, d.name, d.api_code, d.folder_id, d.header_image, d.header_gradient, d.created_at, d.updated_at,
      COUNT(r.id) AS record_count
    FROM databases d
    LEFT JOIN records r ON r.database_id = d.id
    GROUP BY d.id
    ORDER BY d.updated_at DESC
  `).all();

  const filtered = rows.filter(row => {
    if (folderId !== null && row.folder_id !== folderId) return false;
    if (search && !String(row.name).toLowerCase().includes(search)) return false;
    return true;
  });

  res.json(filtered);
});

app.post('/api/databases', (req, res) => {
  const { name, folderId = null } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'El nombre de la base de datos es obligatorio' });
  }

  const databaseId = createDatabaseTx(String(name).trim(), folderId ? Number(folderId) : null);
  emitWebhookEvent('database.created', { id: databaseId, name: String(name).trim(), folderId: folderId ? Number(folderId) : null });
  res.status(201).json({ id: databaseId });
});

app.get('/api/databases/resolve/:code', (req, res) => {
  const database = getDatabaseByCode(req.params.code);
  if (!database) return res.status(404).json({ error: 'Código de base de datos no encontrado' });
  return res.json({ id: Number(database.id), name: database.name, code: database.api_code });
});

app.get('/api/databases/:id', (req, res) => {
  const data = resolveDatabaseRowIdentifier(req.params.id);
  if (!data) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(data.id);

  const properties = listProperties(databaseId);
  const views = listViews(databaseId);
  const totalRecords = db.prepare('SELECT COUNT(*) AS c FROM records WHERE database_id = ?').get(databaseId).c;

  res.json({
    ...data,
    properties,
    views,
    totalRecords,
  });
});

app.put('/api/databases/:id/settings', (req, res) => {
  const dbRow = resolveDatabaseRowIdentifier(req.params.id);
  if (!dbRow) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(dbRow.id);

  const payload = req.body || {};
  const name = payload.name ? String(payload.name).trim() : dbRow.name;
  const folderId = payload.folderId === undefined ? dbRow.folder_id : (payload.folderId || null);
  const headerGradient = payload.headerGradient || dbRow.header_gradient || randomGradient();

  db.prepare(`
    UPDATE databases
    SET name = ?, folder_id = ?, header_gradient = ?, updated_at = ?
    WHERE id = ?
  `).run(name, folderId, headerGradient, nowIso(), databaseId);

  if (Array.isArray(payload.propertyVisibility)) {
    const visibilityStmt = db.prepare('UPDATE properties SET is_visible = ? WHERE id = ? AND database_id = ?');
    payload.propertyVisibility.forEach(item => {
      visibilityStmt.run(item.visible ? 1 : 0, Number(item.propertyId), databaseId);
    });
  }

  if (Array.isArray(payload.propertyUpdates)) {
    const updateStmt = db.prepare('UPDATE properties SET name = ?, is_visible = ? WHERE id = ? AND database_id = ?');
    payload.propertyUpdates.forEach(item => {
      const propId = Number(item.propertyId || 0);
      if (!propId) return;
      const nextName = String(item.name || '').trim();
      if (!nextName) return;
      updateStmt.run(nextName, item.visible ? 1 : 0, propId, databaseId);
    });
  }

  emitWebhookEvent('database.settings.updated', {
    id: databaseId,
    name,
    folderId,
    headerGradient,
  });
  res.json({ ok: true });
});

app.post('/api/databases/:id/header-image', upload.single('image'), (req, res) => {
  const dbRow = resolveDatabaseRowIdentifier(req.params.id);
  if (!dbRow) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(dbRow.id);
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });

  const relativePath = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/');
  db.prepare('UPDATE databases SET header_image = ?, updated_at = ? WHERE id = ?').run(relativePath, nowIso(), databaseId);
  res.json({ ok: true, headerImage: `/uploads/${relativePath}` });
});

app.delete('/api/databases/:id/header-image', (req, res) => {
  const dbRow = resolveDatabaseRowIdentifier(req.params.id);
  if (!dbRow) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(dbRow.id);

  if (dbRow.header_image) {
    const abs = path.join(UPLOADS_DIR, dbRow.header_image);
    if (fs.existsSync(abs)) fs.rmSync(abs, { force: true });
  }

  db.prepare('UPDATE databases SET header_image = NULL, updated_at = ? WHERE id = ?').run(nowIso(), databaseId);
  res.json({ ok: true });
});

app.delete('/api/databases/:id', (req, res) => {
  const row = resolveDatabaseRowIdentifier(req.params.id);
  if (!row) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(row.id);

  db.prepare('DELETE FROM databases WHERE id = ?').run(databaseId);
  const dir = path.join(UPLOADS_DIR, `db_${databaseId}`);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  emitWebhookEvent('database.deleted', { id: databaseId, name: row.name });
  res.json({ ok: true });
});

app.post('/api/databases/:id/properties', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  if (!getDatabase(databaseId)) return res.status(404).json({ error: 'Base de datos no encontrada' });

  const body = req.body || {};
  const name = String(body.name || '').trim();
  const type = String(body.type || 'text');
  ensureType(type);

  if (!name) return res.status(400).json({ error: 'Nombre de propiedad obligatorio' });

  const properties = listProperties(databaseId);
  let key = normalizeKey(body.key || name);
  const used = new Set(properties.map(p => p.key));
  let seq = 2;
  while (used.has(key)) {
    key = `${normalizeKey(name)}_${seq}`;
    seq += 1;
  }

  const cfg = sanitizePropertyConfig(type, body.config || {});
  const ts = nowIso();
  const position = properties.length;

  const insertProperty = db.prepare(`
    INSERT INTO properties(database_id, key, name, type, config_json, is_visible, position, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const result = insertProperty.run(databaseId, key, name, type, JSON.stringify(cfg), body.isVisible === false ? 0 : 1, position, ts);
    const propertyId = Number(result.lastInsertRowid);

    if (type === 'relation' && cfg.showOnRelatedDatabase && cfg.relatedDatabaseId) {
      const targetDb = getDatabase(cfg.relatedDatabaseId);
      const sourceDb = getDatabase(databaseId);
      if (targetDb && sourceDb) {
        const targetProps = listProperties(targetDb.id);
        const reciprocalName = cfg.reciprocalPropertyName || sourceDb.name;
        let reciprocalKey = normalizeKey(reciprocalName);
        const usedKeys = new Set(targetProps.map(prop => prop.key));
        let seq = 2;
        while (usedKeys.has(reciprocalKey)) {
          reciprocalKey = `${normalizeKey(reciprocalName)}_${seq}`;
          seq += 1;
        }

        const reciprocalCfg = sanitizePropertyConfig('relation', {
          relatedDatabaseId: databaseId,
          showOnRelatedDatabase: false,
          reciprocalPropertyId: propertyId,
        });

        const reciprocalResult = insertProperty.run(
          targetDb.id,
          reciprocalKey,
          reciprocalName,
          'relation',
          JSON.stringify(reciprocalCfg),
          1,
          targetProps.length,
          ts,
        );

        cfg.reciprocalPropertyId = Number(reciprocalResult.lastInsertRowid);
        db.prepare('UPDATE properties SET config_json = ? WHERE id = ?').run(JSON.stringify(cfg), propertyId);
        db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(ts, targetDb.id);
      }
    }

    db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(ts, databaseId);
    return propertyId;
  });

  const createdId = tx();
  emitWebhookEvent('property.created', {
    databaseId,
    propertyId: createdId,
    name,
    type,
  });
  res.status(201).json({ id: createdId });
});

app.put('/api/properties/:id', (req, res) => {
  const propertyId = Number(req.params.id);
  const row = db.prepare('SELECT id, database_id, type FROM properties WHERE id = ?').get(propertyId);
  if (!row) return res.status(404).json({ error: 'Propiedad no encontrada' });

  const body = req.body || {};
  const current = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
  const nextName = body.name ? String(body.name).trim() : current.name;
  const nextVisible = body.isVisible === undefined ? current.is_visible : (body.isVisible ? 1 : 0);
  const type = body.type ? String(body.type) : current.type;
  ensureType(type);
  const nextConfig = sanitizePropertyConfig(type, body.config === undefined ? parseJson(current.config_json, {}) : body.config);

  db.prepare(`
    UPDATE properties
    SET name = ?, type = ?, config_json = ?, is_visible = ?
    WHERE id = ?
  `).run(nextName, type, JSON.stringify(nextConfig), nextVisible, propertyId);

  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(nowIso(), row.database_id);
  emitWebhookEvent('property.updated', {
    propertyId,
    databaseId: row.database_id,
    name: nextName,
    type,
  });
  res.json({ ok: true });
});

app.delete('/api/properties/:id', (req, res) => {
  const propertyId = Number(req.params.id);
  const row = db.prepare('SELECT id, database_id, type, key FROM properties WHERE id = ?').get(propertyId);
  if (!row) return res.status(404).json({ error: 'Propiedad no encontrada' });

  db.prepare('DELETE FROM properties WHERE id = ?').run(propertyId);
  db.prepare('DELETE FROM attachments WHERE property_id = ?').run(propertyId);
  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(nowIso(), row.database_id);
  emitWebhookEvent('property.deleted', {
    propertyId,
    databaseId: row.database_id,
    type: row.type,
    key: row.key,
  });
  res.json({ ok: true });
});

app.post('/api/databases/:id/views', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  if (!getDatabase(databaseId)) return res.status(404).json({ error: 'Base de datos no encontrada' });

  const body = req.body || {};
  const name = String(body.name || '').trim();
  const type = String(body.type || 'table').trim();
  if (!name) return res.status(400).json({ error: 'Nombre de vista obligatorio' });
  if (!['table', 'gallery', 'analysis'].includes(type)) return res.status(400).json({ error: 'Tipo de vista inválido' });

  const lastPosition = db.prepare('SELECT COALESCE(MAX(position), -1) AS max_pos FROM database_views WHERE database_id = ?').get(databaseId);
  const nextPosition = Number(lastPosition?.max_pos ?? -1) + 1;
  const ts = nowIso();
  const result = db.prepare(`
    INSERT INTO database_views(database_id, name, type, position, config_json, created_at)
    VALUES(?, ?, ?, ?, ?, ?)
  `).run(databaseId, name, type, nextPosition, JSON.stringify(body.config || {}), ts);

  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(ts, databaseId);
  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

app.put('/api/views/:id', (req, res) => {
  const viewId = Number(req.params.id);
  const view = db.prepare('SELECT id, database_id, name, type, config_json FROM database_views WHERE id = ?').get(viewId);
  if (!view) return res.status(404).json({ error: 'Vista no encontrada' });

  const body = req.body || {};
  db.prepare(`
    UPDATE database_views
    SET name = ?, type = ?, config_json = ?
    WHERE id = ?
  `).run(
    body.name ? String(body.name).trim() : view.name,
    body.type ? String(body.type) : view.type,
    JSON.stringify(body.config === undefined ? parseJson(view.config_json, {}) : body.config),
    viewId,
  );

  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(nowIso(), view.database_id);
  res.json({ ok: true });
});

app.delete('/api/views/:id', (req, res) => {
  const viewId = Number(req.params.id);
  const view = db.prepare('SELECT id, database_id FROM database_views WHERE id = ?').get(viewId);
  if (!view) return res.status(404).json({ error: 'Vista no encontrada' });

  db.prepare('DELETE FROM database_views WHERE id = ?').run(viewId);
  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(nowIso(), view.database_id);
  res.json({ ok: true });
});

app.put('/api/databases/:id/views/order', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  if (!getDatabase(databaseId)) return res.status(404).json({ error: 'Base de datos no encontrada' });

  const payload = req.body || {};
  const viewIds = Array.isArray(payload.viewIds)
    ? payload.viewIds.map(item => Number(item)).filter(Boolean)
    : [];

  if (!viewIds.length) {
    return res.status(400).json({ error: 'Debes enviar al menos una vista' });
  }

  const current = db.prepare('SELECT id FROM database_views WHERE database_id = ?').all(databaseId).map(item => Number(item.id));
  const currentSet = new Set(current);
  if (viewIds.length !== current.length || viewIds.some(id => !currentSet.has(id))) {
    return res.status(400).json({ error: 'El orden de vistas no coincide con las vistas existentes' });
  }

  const updateStmt = db.prepare('UPDATE database_views SET position = ? WHERE id = ? AND database_id = ?');
  const tx = db.transaction(() => {
    viewIds.forEach((viewId, index) => {
      updateStmt.run(index, viewId, databaseId);
    });
  });
  tx();

  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(nowIso(), databaseId);
  res.json({ ok: true });
});

app.put('/api/databases/:id/properties/order', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  if (!getDatabase(databaseId)) return res.status(404).json({ error: 'Base de datos no encontrada' });

  const payload = req.body || {};
  const propertyIds = Array.isArray(payload.propertyIds)
    ? payload.propertyIds.map(item => Number(item)).filter(Boolean)
    : [];

  if (!propertyIds.length) {
    return res.status(400).json({ error: 'Debes enviar al menos una propiedad' });
  }

  const current = db.prepare('SELECT id FROM properties WHERE database_id = ?').all(databaseId).map(item => Number(item.id));
  const currentSet = new Set(current);
  if (propertyIds.length !== current.length || propertyIds.some(id => !currentSet.has(id))) {
    return res.status(400).json({ error: 'El orden de propiedades no coincide con las propiedades existentes' });
  }

  const updateStmt = db.prepare('UPDATE properties SET position = ? WHERE id = ? AND database_id = ?');
  const tx = db.transaction(() => {
    propertyIds.forEach((propertyId, index) => {
      updateStmt.run(index, propertyId, databaseId);
    });
  });
  tx();

  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(nowIso(), databaseId);
  emitWebhookEvent('database.properties.reordered', {
    databaseId,
    propertyCount: propertyIds.length,
  });
  res.json({ ok: true });
});

app.get('/api/databases/:id/filter-options', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  if (!getDatabase(databaseId)) return res.status(404).json({ error: 'Base de datos no encontrada' });

  const properties = listProperties(databaseId);
  const options = {};
  properties.forEach(prop => {
    options[prop.id] = getPropertyOptions(databaseId, prop);
  });

  res.json(options);
});

app.get('/api/databases/:id/record-options', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  if (!getDatabase(databaseId)) return res.status(404).json({ error: 'Base de datos no encontrada' });

  const term = String(req.query.search || '').toLowerCase().trim();
  const allRequested = ['1', 'true', 'yes', 'on'].includes(String(req.query.all || '').toLowerCase().trim());
  const limitRaw = Number(req.query.limit || 0);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 0;
  const useLimit = !allRequested && limit > 0;

  const rows = useLimit
    ? db.prepare('SELECT id FROM records WHERE database_id = ? ORDER BY id DESC LIMIT ?').all(databaseId, limit)
    : db.prepare('SELECT id FROM records WHERE database_id = ? ORDER BY id DESC').all(databaseId);

  const includeIds = String(req.query.includeIds || '')
    .split(',')
    .map(part => Number(part.trim()))
    .filter(id => Number.isInteger(id) && id > 0);

  if (includeIds.length) {
    const listed = new Set(rows.map(row => Number(row.id)));
    const missing = includeIds.filter(id => !listed.has(id));
    if (missing.length) {
      const placeholders = missing.map(() => '?').join(',');
      const missingRows = db.prepare(`
        SELECT id
        FROM records
        WHERE database_id = ?
          AND id IN (${placeholders})
        ORDER BY id DESC
      `).all(databaseId, ...missing);
      rows.push(...missingRows);
    }
  }

  const options = rows
    .map(row => ({ id: row.id, label: getRecordLabel(databaseId, row.id) }))
    .filter(item => !term || item.label.toLowerCase().includes(term));

  res.json(options);
});

app.get('/api/properties/:id/related-properties', (req, res) => {
  const propertyId = Number(req.params.id);
  const prop = db.prepare('SELECT id, type, config_json FROM properties WHERE id = ?').get(propertyId);
  if (!prop) return res.status(404).json({ error: 'Propiedad no encontrada' });
  if (prop.type !== 'relation') return res.status(400).json({ error: 'La propiedad no es de tipo relación' });

  const cfg = parseJson(prop.config_json, {});
  const targetDbId = Number(cfg.relatedDatabaseId || (Array.isArray(cfg.relatedDatabaseIds) ? cfg.relatedDatabaseIds[0] : 0) || 0);
  if (!targetDbId) return res.json([]);
  if (!getDatabase(targetDbId)) return res.json([]);

  const properties = listProperties(targetDbId).map(item => ({
    id: item.id,
    key: item.key,
    name: item.name,
    type: item.type,
  }));

  res.json(properties);
});

app.get('/api/properties/:id/options', (req, res) => {
  const propertyId = Number(req.params.id);
  const row = db.prepare('SELECT id, database_id FROM properties WHERE id = ?').get(propertyId);
  if (!row) return res.status(404).json({ error: 'Propiedad no encontrada' });

  const fullProp = listProperties(row.database_id).find(item => item.id === propertyId);
  if (!fullProp) return res.status(404).json({ error: 'Propiedad no encontrada' });

  res.json(getPropertyOptions(row.database_id, fullProp));
});

app.get('/api/databases/:id/records', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  if (!getDatabase(databaseId)) return res.status(404).json({ error: 'Base de datos no encontrada' });

  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(500, Math.max(1, Number(req.query.pageSize || 50)));
  const search = String(req.query.search || '').toLowerCase().trim();
  const sortPropertyId = Number(req.query.sortPropertyId || 0);
  const sortDir = String(req.query.sortDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const filters = parseJson(String(req.query.filters || '[]'), []);
  const requestedSorts = parseJson(String(req.query.sorts || '[]'), []);

  const props = listProperties(databaseId);
  const rows = loadRecordRows(databaseId);
  applyRollups(databaseId, rows);

  let render = rows.map(row => toRenderableRecord(databaseId, row, props));

  if (search) {
    render = render.filter(record => Object.values(record.values).some(value => {
      if (Array.isArray(value)) return value.join(' ').toLowerCase().includes(search);
      return String(value || '').toLowerCase().includes(search);
    }));
  }

  render = render.filter(record => filterRecord(record, filters, props));

  const normalizedSorts = Array.isArray(requestedSorts)
    ? requestedSorts
      .map(item => ({
        propertyId: Number(item?.propertyId || 0),
        dir: String(item?.dir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc',
      }))
      .filter(item => item.propertyId)
    : [];

  if (!normalizedSorts.length && sortPropertyId) {
    normalizedSorts.push({ propertyId: sortPropertyId, dir: sortDir });
  }

  if (normalizedSorts.length) {
    const sortMeta = normalizedSorts
      .map(item => ({
        dir: item.dir,
        prop: props.find(p => p.id === item.propertyId),
      }))
      .filter(item => item.prop);

    if (sortMeta.length) {
      render.sort((a, b) => {
        for (const item of sortMeta) {
          const av = a.values[item.prop.key];
          const bv = b.values[item.prop.key];
          const va = Array.isArray(av) ? av.join(', ') : av;
          const vb = Array.isArray(bv) ? bv.join(', ') : bv;
          const cmp = compareValues(va, vb);
          if (cmp !== 0) return item.dir === 'asc' ? cmp : -cmp;
        }
        return compareValues(a.id, b.id);
      });
    }
  }

  const totalAll = rows.length;
  const total = render.length;
  const start = (page - 1) * pageSize;
  const data = render.slice(start, start + pageSize);

  res.json({ data, total, totalAll, page, pageSize, properties: props });
});

app.post('/api/databases/:id/records', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  if (!getDatabase(databaseId)) return res.status(404).json({ error: 'Base de datos no encontrada' });

  const body = req.body || {};
  const values = body.values || {};
  const props = listProperties(databaseId);
  const propByKey = new Map(props.map(p => [p.key, p]));

  const tx = db.transaction(() => {
    const ts = nowIso();
    const recordResult = db.prepare('INSERT INTO records(database_id, created_at, updated_at) VALUES(?, ?, ?)').run(databaseId, ts, ts);
    const recordId = Number(recordResult.lastInsertRowid);

    const upsertValue = db.prepare(`
      INSERT INTO record_values(record_id, property_id, value_json)
      VALUES(?, ?, ?)
      ON CONFLICT(record_id, property_id) DO UPDATE SET value_json = excluded.value_json
    `);

    const pendingRelationSync = [];

    props.forEach(prop => {
      let value = values[prop.key];
      if (prop.type === 'autoId') {
        const dbRow = getDatabase(databaseId);
        value = dbRow.next_auto_id;
        db.prepare('UPDATE databases SET next_auto_id = next_auto_id + 1 WHERE id = ?').run(databaseId);
      }

      if (value === undefined) {
        if (prop.type === 'checkbox') value = false;
        else if (prop.type === 'multiSelect' || prop.type === 'relation' || prop.type === 'rollup') value = [];
        else value = null;
      }

      if (prop.type === 'rollup') {
        value = [];
      }

      if (prop.type === 'relation') {
        value = normalizeRelationValue(prop, value);
        pendingRelationSync.push({ relationProp: prop, prevIds: [], nextIds: value });
      }

      upsertValue.run(recordId, prop.id, JSON.stringify(value));
    });

    pendingRelationSync.forEach(item => {
      syncReciprocalRelationLinks({ ...item, recordId });
    });

    db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(ts, databaseId);
    return recordId;
  });

  const id = tx();
  emitWebhookEvent('record.created', { databaseId, recordId: id });
  res.status(201).json({ id });
});

app.get('/api/records/:id', (req, res) => {
  const recordId = Number(req.params.id);
  const record = getRecordById(recordId);
  if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

  const props = listProperties(record.database_id);
  const rows = loadRecordRows(record.database_id);
  applyRollups(record.database_id, rows);
  const row = rows.find(item => item.id === recordId);
  if (!row) return res.status(404).json({ error: 'Registro no encontrado' });

  const render = toRenderableRecord(record.database_id, row, props);
  return res.json({
    ...render,
    databaseId: record.database_id,
  });
});

app.post('/api/records/:id/content', (req, res) => {
  const recordId = Number(req.params.id);
  const record = getRecordById(recordId);
  if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

  const body = req.body || {};
  const byPropertyId = Number(body.propertyId || 0);
  const byPropertyKey = String(body.propertyKey || '').trim();
  const value = body.value;

  const props = listProperties(record.database_id);
  let prop = null;
  if (byPropertyId) {
    prop = props.find(item => item.id === byPropertyId);
  } else if (byPropertyKey) {
    prop = props.find(item => item.key === byPropertyKey);
  }

  if (!prop) return res.status(400).json({ error: 'Propiedad no encontrada en el registro' });
  if (prop.type === 'autoId' || prop.type === 'rollup') {
    return res.status(400).json({ error: 'No se puede editar este tipo de propiedad' });
  }

  const upsertValue = db.prepare(`
    INSERT INTO record_values(record_id, property_id, value_json)
    VALUES(?, ?, ?)
    ON CONFLICT(record_id, property_id) DO UPDATE SET value_json = excluded.value_json
  `);

  let nextValue = value;
  if (prop.type === 'relation') {
    const prevRow = db.prepare('SELECT value_json FROM record_values WHERE record_id = ? AND property_id = ?').get(recordId, prop.id);
    const prevParsed = parseJson(prevRow?.value_json || '[]', []);
    const prevIds = Array.isArray(prevParsed) ? prevParsed.map(v => Number(v)).filter(Boolean) : [];
    nextValue = normalizeRelationValue(prop, nextValue);
    syncReciprocalRelationLinks({ relationProp: prop, recordId, prevIds, nextIds: nextValue });
  }

  upsertValue.run(recordId, prop.id, JSON.stringify(nextValue));
  const ts = nowIso();
  db.prepare('UPDATE records SET updated_at = ? WHERE id = ?').run(ts, recordId);
  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(ts, record.database_id);
  emitWebhookEvent('record.content.updated', {
    databaseId: record.database_id,
    recordId,
    propertyId: prop.id,
    propertyKey: prop.key,
  });

  return res.json({ ok: true });
});

app.put('/api/records/:id', (req, res) => {
  const recordId = Number(req.params.id);
  const record = getRecordById(recordId);
  if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

  const props = listProperties(record.database_id);
  const body = req.body || {};
  const values = body.values || {};

  const upsertValue = db.prepare(`
    INSERT INTO record_values(record_id, property_id, value_json)
    VALUES(?, ?, ?)
    ON CONFLICT(record_id, property_id) DO UPDATE SET value_json = excluded.value_json
  `);

  const pendingRelationSync = [];

  props.forEach(prop => {
    if (prop.type === 'autoId' || prop.type === 'rollup') return;
    if (!(prop.key in values)) return;

    let nextValue = values[prop.key];
    if (prop.type === 'relation') {
      const prevRow = db.prepare('SELECT value_json FROM record_values WHERE record_id = ? AND property_id = ?').get(recordId, prop.id);
      const prevParsed = parseJson(prevRow?.value_json || '[]', []);
      const prevIds = Array.isArray(prevParsed) ? prevParsed.map(v => Number(v)).filter(Boolean) : [];
      nextValue = normalizeRelationValue(prop, nextValue);
      pendingRelationSync.push({ relationProp: prop, prevIds, nextIds: nextValue });
    }

    upsertValue.run(recordId, prop.id, JSON.stringify(nextValue));
  });

  pendingRelationSync.forEach(item => {
    syncReciprocalRelationLinks({ ...item, recordId });
  });

  const ts = nowIso();
  db.prepare('UPDATE records SET updated_at = ? WHERE id = ?').run(ts, recordId);
  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(ts, record.database_id);
  emitWebhookEvent('record.updated', { databaseId: record.database_id, recordId });
  res.json({ ok: true });
});

app.delete('/api/records/:id', (req, res) => {
  const recordId = Number(req.params.id);
  const record = getRecordById(recordId);
  if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

  const files = db.prepare('SELECT storage_path FROM attachments WHERE record_id = ?').all(recordId);

  const relationProps = listProperties(record.database_id).filter(prop => prop.type === 'relation');
  relationProps.forEach(prop => {
    const row = db.prepare('SELECT value_json FROM record_values WHERE record_id = ? AND property_id = ?').get(recordId, prop.id);
    const parsed = parseJson(row?.value_json || '[]', []);
    const prevIds = Array.isArray(parsed) ? parsed.map(v => Number(v)).filter(Boolean) : [];
    syncReciprocalRelationLinks({ relationProp: prop, recordId, prevIds, nextIds: [] });
  });

  db.prepare('DELETE FROM records WHERE id = ?').run(recordId);

  files.forEach(file => {
    const abs = path.join(UPLOADS_DIR, file.storage_path);
    if (fs.existsSync(abs)) fs.rmSync(abs, { force: true });
  });

  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(nowIso(), record.database_id);
  emitWebhookEvent('record.deleted', { databaseId: record.database_id, recordId });
  res.json({ ok: true });
});

app.get('/api/records/:recordId/attachments', (req, res) => {
  const recordId = Number(req.params.recordId);
  const record = getRecordById(recordId);
  if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

  const rows = db.prepare(`
    SELECT id, database_id, record_id, property_id, file_name, storage_path, mime_type, size_bytes, created_at
    FROM attachments
    WHERE record_id = ?
    ORDER BY id ASC
  `).all(recordId);

  return res.json(rows.map(row => ({
    ...row,
    downloadUrl: `/api/attachments/${row.id}/download`,
    url: `/uploads/${row.storage_path}`,
  })));
});

app.post('/api/records/:recordId/attachments/:propertyId', upload.single('file'), (req, res) => {
  const recordId = Number(req.params.recordId);
  const propertyId = Number(req.params.propertyId);
  const record = getRecordById(recordId);
  if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

  const property = db.prepare('SELECT id, database_id, type FROM properties WHERE id = ?').get(propertyId);
  if (!property || property.database_id !== record.database_id || property.type !== 'attachment') {
    return res.status(400).json({ error: 'Propiedad de adjunto inválida' });
  }

  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

  const relativePath = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/');
  const ts = nowIso();
  const result = db.prepare(`
    INSERT INTO attachments(database_id, record_id, property_id, file_name, storage_path, mime_type, size_bytes, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.database_id,
    recordId,
    propertyId,
    req.file.originalname,
    relativePath,
    req.file.mimetype || 'application/octet-stream',
    req.file.size || 0,
    ts,
  );

  db.prepare('UPDATE records SET updated_at = ? WHERE id = ?').run(ts, recordId);
  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(ts, record.database_id);

  const createdAttachmentId = Number(result.lastInsertRowid);
  emitWebhookEvent('attachment.created', {
    databaseId: record.database_id,
    recordId,
    propertyId,
    attachmentId: createdAttachmentId,
    fileName: req.file.originalname,
  });

  res.status(201).json({
    id: createdAttachmentId,
    file_name: req.file.originalname,
    url: `/uploads/${relativePath}`,
    downloadUrl: `/api/attachments/${createdAttachmentId}/download`,
  });
});

app.get('/api/attachments/:id/download', (req, res) => {
  const attachmentId = Number(req.params.id);
  const file = db.prepare(`
    SELECT id, file_name, storage_path, mime_type, size_bytes
    FROM attachments
    WHERE id = ?
  `).get(attachmentId);
  if (!file) return res.status(404).json({ error: 'Adjunto no encontrado' });

  const abs = path.join(UPLOADS_DIR, file.storage_path);
  if (!fs.existsSync(abs)) return res.status(404).json({ error: 'El archivo físico no existe' });

  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
  res.setHeader('Content-Length', String(file.size_bytes || fs.statSync(abs).size));
  return res.download(abs, file.file_name);
});

app.delete('/api/attachments/:id', (req, res) => {
  const attachmentId = Number(req.params.id);
  const file = db.prepare('SELECT id, storage_path, record_id, database_id FROM attachments WHERE id = ?').get(attachmentId);
  if (!file) return res.status(404).json({ error: 'Adjunto no encontrado' });

  db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);
  const abs = path.join(UPLOADS_DIR, file.storage_path);
  if (fs.existsSync(abs)) fs.rmSync(abs, { force: true });

  const ts = nowIso();
  db.prepare('UPDATE records SET updated_at = ? WHERE id = ?').run(ts, file.record_id);
  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(ts, file.database_id);
  emitWebhookEvent('attachment.deleted', {
    databaseId: file.database_id,
    recordId: file.record_id,
    attachmentId,
  });
  res.json({ ok: true });
});

app.delete('/api/attachments-by-url', (req, res) => {
  const url = String(req.body?.url || '');
  if (!url) return res.status(400).json({ error: 'URL requerida' });
  const storagePath = url.replace(/^\/uploads\//, '');
  const file = db.prepare('SELECT id, storage_path, record_id, database_id FROM attachments WHERE storage_path = ?').get(storagePath);
  if (!file) return res.status(404).json({ error: 'Adjunto no encontrado' });

  db.prepare('DELETE FROM attachments WHERE id = ?').run(file.id);
  const abs = path.join(UPLOADS_DIR, file.storage_path);
  if (fs.existsSync(abs)) fs.rmSync(abs, { force: true });

  const ts = nowIso();
  db.prepare('UPDATE records SET updated_at = ? WHERE id = ?').run(ts, file.record_id);
  db.prepare('UPDATE databases SET updated_at = ? WHERE id = ?').run(ts, file.database_id);
  emitWebhookEvent('attachment.deleted', {
    databaseId: file.database_id,
    recordId: file.record_id,
    attachmentId: file.id,
  });
  res.json({ ok: true });
});

app.post('/api/databases/:id/analysis', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  if (!getDatabase(databaseId)) return res.status(404).json({ error: 'Base de datos no encontrada' });

  const body = req.body || {};
  const chart = computeChart(databaseId, body);
  const chi = body.chiAPropertyId && body.chiBPropertyId
    ? computeChiSquare(databaseId, body.chiAPropertyId, body.chiBPropertyId)
    : null;

  res.json({ chart, chi });
});

app.get('/api/tag-colors', (_req, res) => {
  res.json(TAG_COLORS);
});

app.get('/api/databases/:id/backup', (req, res) => {
  const database = resolveDatabaseRowIdentifier(req.params.id);
  if (!database) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(database.id);
  const includeFiles = req.query.includeFiles === '0' ? '0' : '1';
  const mode = req.query.mode ? String(req.query.mode) : 'full';
  const filters = req.query.filters ? `&filters=${encodeURIComponent(String(req.query.filters))}` : '';
  const search = req.query.search ? `&search=${encodeURIComponent(String(req.query.search))}` : '';
  return res.redirect(307, `/api/databases/${databaseId}/export?includeFiles=${includeFiles}&mode=${encodeURIComponent(mode)}${filters}${search}`);
});

app.get('/api/backup/full', (_req, res) => {
  const filename = `dubydb_full_backup_${Date.now()}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(res);

  if (fs.existsSync(DB_PATH)) {
    archive.file(DB_PATH, { name: 'database/duby.db' });
  }
  if (fs.existsSync(UPLOADS_DIR)) {
    archive.directory(UPLOADS_DIR, 'uploads');
  }

  archive.append(JSON.stringify({
    version: 1,
    exportedAt: nowIso(),
    databasePath: DB_PATH,
    uploadsPath: UPLOADS_DIR,
  }, null, 2), { name: 'manifest.json' });

  archive.finalize();
  emitWebhookEvent('backup.full.exported', { fileName: filename });
});

const fullRestoreUpload = multer({ dest: path.join(DATA_DIR, 'tmp_restore') });
app.post('/api/backup/full/restore', fullRestoreUpload.single('backup'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

  const tempDir = path.join(DATA_DIR, `tmp_full_restore_${Date.now()}`);
  let sourceDbPath = '';
  let sourceUploadsDir = '';

  try {
    if (path.extname(req.file.originalname).toLowerCase() !== '.zip') {
      return res.status(400).json({ error: 'Formato no soportado. Usa .zip' });
    }

    fs.mkdirSync(tempDir, { recursive: true });
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(unzipper.Extract({ path: tempDir }))
        .on('close', resolve)
        .on('error', reject);
    });

    sourceDbPath = path.join(tempDir, 'database', 'duby.db');
    sourceUploadsDir = path.join(tempDir, 'uploads');

    if (!fs.existsSync(sourceDbPath)) {
      return res.status(400).json({ error: 'El ZIP no contiene database/duby.db' });
    }

    const replaceAllDataTx = db.transaction(() => {
      db.exec('PRAGMA foreign_keys = OFF');
      db.exec(`
        DELETE FROM attachments;
        DELETE FROM record_values;
        DELETE FROM records;
        DELETE FROM database_views;
        DELETE FROM properties;
        DELETE FROM databases;
        DELETE FROM folders;
        DELETE FROM webhook_deliveries;
        DELETE FROM app_settings;
      `);

      const escapedPath = sourceDbPath.replace(/'/g, "''");
      db.exec(`ATTACH DATABASE '${escapedPath}' AS restore_src`);

      const sourceDatabasesCols = new Set(db.prepare('PRAGMA restore_src.table_info(databases)').all().map(column => column.name));
      const sourceViewsCols = new Set(db.prepare('PRAGMA restore_src.table_info(database_views)').all().map(column => column.name));

      const insertDatabasesSql = sourceDatabasesCols.has('api_code')
        ? `
        INSERT INTO databases(id, name, api_code, folder_id, header_image, header_gradient, next_auto_id, created_at, updated_at)
        SELECT id, name, api_code, folder_id, header_image, header_gradient, next_auto_id, created_at, updated_at
        FROM restore_src.databases;
      `
        : `
        INSERT INTO databases(id, name, folder_id, header_image, header_gradient, next_auto_id, created_at, updated_at)
        SELECT id, name, folder_id, header_image, header_gradient, next_auto_id, created_at, updated_at
        FROM restore_src.databases;
      `;

      const insertViewsSql = sourceViewsCols.has('position')
        ? `
        INSERT INTO database_views(id, database_id, name, type, position, config_json, created_at)
        SELECT id, database_id, name, type, position, config_json, created_at
        FROM restore_src.database_views;
      `
        : `
        INSERT INTO database_views(id, database_id, name, type, position, config_json, created_at)
        SELECT id, database_id, name, type, 0, config_json, created_at
        FROM restore_src.database_views;
      `;

      db.exec(`
        INSERT INTO folders SELECT * FROM restore_src.folders;
        ${insertDatabasesSql}
        INSERT INTO properties SELECT * FROM restore_src.properties;
        INSERT INTO records SELECT * FROM restore_src.records;
        INSERT INTO record_values SELECT * FROM restore_src.record_values;
        ${insertViewsSql}
        INSERT INTO attachments SELECT * FROM restore_src.attachments;
        INSERT INTO app_settings SELECT * FROM restore_src.app_settings;
        INSERT INTO webhook_deliveries SELECT * FROM restore_src.webhook_deliveries;
        DELETE FROM sqlite_sequence;
        INSERT INTO sqlite_sequence SELECT * FROM restore_src.sqlite_sequence;
      `);
      db.exec('DETACH DATABASE restore_src');
      db.exec('PRAGMA foreign_keys = ON');
    });

    replaceAllDataTx();
    ensureDatabaseApiCodeColumn();

    fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (fs.existsSync(sourceUploadsDir)) {
      copyDirRecursive(sourceUploadsDir, UPLOADS_DIR);
    }

    emitWebhookEvent('backup.full.restored', {
      restoredAt: nowIso(),
      sourceFile: req.file.originalname,
    });

    res.json({ ok: true, message: 'Portfolio restaurado correctamente' });
  } catch (err) {
    console.error('[FULL RESTORE ERROR]', err);
    res.status(500).json({ error: 'Error al restaurar backup completo: ' + err.message });
  } finally {
    if (req.file?.path) fs.rmSync(req.file.path, { force: true });
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

/* ── Export database as JSON/ZIP ── */
app.get('/api/databases/:id/export', (req, res) => {
  const dbRow = resolveDatabaseRowIdentifier(req.params.id);
  if (!dbRow) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const databaseId = Number(dbRow.id);

  const includeFiles = req.query.includeFiles === '1';
  const mode = req.query.mode || 'full'; // 'full' | 'view'

  const props = listProperties(databaseId);
  const views = listViews(databaseId);
  let rows = loadRecordRows(databaseId);
  applyRollups(databaseId, rows);
  let records = rows.map(row => toRenderableRecord(databaseId, row, props));

  /* If mode=view, apply current filters/sorts from query params */
  if (mode === 'view') {
    const filters = parseJson(req.query.filters || '[]', []);
    const search = String(req.query.search || '').trim().toLowerCase();

    if (filters.length) {
      records = records.filter(rec => filterRecord(rec, filters, props));
    }
    if (search) {
      records = records.filter(rec => {
        return props.some(prop => {
          const val = rec.values[prop.key];
          const str = Array.isArray(val) ? val.join(' ') : String(val || '');
          return str.toLowerCase().includes(search);
        });
      });
    }
  }

  /* Gather all attachment rows for included records */
  const recordIds = records.map(r => r.id);
  const attachmentRows = listAttachmentsByRecord(recordIds);

  const payload = {
    version: 1,
    exportedAt: nowIso(),
    database: dbRow,
    properties: props.map(p => ({
      id: p.id,
      key: p.key,
      name: p.name,
      type: p.type,
      config_json: JSON.stringify(p.config),
      is_visible: p.is_visible ? 1 : 0,
      position: p.position,
    })),
    views: views.map(v => ({
      id: v.id,
      name: v.name,
      type: v.type,
      position: v.position,
      config_json: JSON.stringify(v.config),
    })),
    records: records.map(r => {
      const rawRow = rows.find(raw => raw.id === r.id);
      const valuesById = {};
      props.forEach(prop => {
        valuesById[prop.id] = rawRow ? rawRow.values[prop.id] : null;
      });
      return { id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, valuesById };
    }),
    attachments: attachmentRows.map(a => ({
      id: a.id,
      record_id: a.record_id,
      property_id: a.property_id,
      file_name: a.file_name,
      storage_path: a.storage_path,
      mime_type: a.mime_type,
      size_bytes: a.size_bytes,
    })),
  };

  if (!includeFiles) {
    const safeName = dbRow.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="dubydb_${safeName}_${Date.now()}.json"`);
    emitWebhookEvent('database.exported', {
      databaseId,
      includeFiles,
      mode,
      recordCount: records.length,
    });
    return res.json(payload);
  }

  /* Stream a ZIP with the JSON + attachment files */
  const safeName = dbRow.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="dubydb_${safeName}_${Date.now()}.zip"`);

  const archive = archiver('zip', { zlib: { level: 5 } });
  archive.pipe(res);
  archive.append(JSON.stringify(payload, null, 2), { name: 'database.json' });

  attachmentRows.forEach(a => {
    const absPath = path.join(UPLOADS_DIR, a.storage_path);
    if (fs.existsSync(absPath)) {
      archive.file(absPath, { name: `files/${a.storage_path}` });
    }
  });

  archive.finalize();
  emitWebhookEvent('database.exported', {
    databaseId,
    includeFiles,
    mode,
    recordCount: records.length,
  });
});

/* ── Restore / import database backup ── */
const restoreUpload = multer({ dest: path.join(DATA_DIR, 'tmp_restore') });
app.post('/api/restore', restoreUpload.single('backup'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

  let extractedFilesRoot = null;
  let extractedTempDir = null;

  try {
    let payload;
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext === '.json') {
      const raw = fs.readFileSync(req.file.path, 'utf-8');
      payload = JSON.parse(raw);
    } else if (ext === '.zip') {
      /* Extract zip to temp dir, read database.json, then copy files */
      const tempDir = path.join(DATA_DIR, `tmp_restore_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      extractedTempDir = tempDir;

      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(unzipper.Extract({ path: tempDir }))
          .on('close', resolve)
          .on('error', reject);
      });

      const jsonPath = path.join(tempDir, 'database.json');
      if (!fs.existsSync(jsonPath)) {
        return res.status(400).json({ error: 'El archivo ZIP no contiene database.json' });
      }

      payload = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

      /* Keep extracted files isolated; they are copied later into remapped paths */
      const filesDir = path.join(tempDir, 'files');
      extractedFilesRoot = fs.existsSync(filesDir) ? filesDir : null;
    } else {
      return res.status(400).json({ error: 'Formato no soportado. Usa .json o .zip' });
    }

    /* Validate payload */
    if (!payload || !payload.database || !Array.isArray(payload.properties)) {
      return res.status(400).json({ error: 'Formato de backup inválido' });
    }

    /* Restore database */
    const ts = nowIso();
    const srcDb = payload.database;

    const dbResult = db.prepare(`
      INSERT INTO databases(name, api_code, folder_id, header_image, header_gradient, next_auto_id, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      srcDb.name + ' (restaurada)',
      generateUniqueDatabaseCode(),
      null,
      srcDb.header_image || null,
      srcDb.header_gradient || randomGradient(),
      srcDb.next_auto_id || 1,
      ts,
      ts,
    );
    const newDbId = Number(dbResult.lastInsertRowid);

    /* Map old property IDs to new ones */
    const propIdMap = new Map();
    const restoredPropByOldId = new Map();
    (payload.properties || []).forEach(prop => {
      const propName = String(prop.name || prop.key || 'Propiedad').trim();
      const key = normalizeKey(prop.key || prop.name);
      const uniqueKey = db.prepare('SELECT id FROM properties WHERE database_id = ? AND key = ?').get(newDbId, key)
        ? `${key}_${Date.now()}`
        : key;
      const propType = PROPERTY_TYPES.has(String(prop.type || '')) ? String(prop.type) : 'text';
      const propConfig = sanitizePropertyConfig(propType, parseBackupPropertyConfig(prop));
      const result = db.prepare(`
        INSERT INTO properties(database_id, key, name, type, config_json, is_visible, position, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newDbId,
        uniqueKey,
        propName,
        propType,
        JSON.stringify(propConfig),
        prop.is_visible ?? 1,
        prop.position ?? 0,
        ts,
      );
      const newPropId = Number(result.lastInsertRowid);
      propIdMap.set(prop.id, newPropId);
      restoredPropByOldId.set(Number(prop.id), {
        id: newPropId,
        key: uniqueKey,
        type: propType,
      });
    });

    /* Restore views */
    const sortedViews = [...(payload.views || [])].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
    sortedViews.forEach((view, index) => {
      db.prepare(`
        INSERT INTO database_views(database_id, name, type, position, config_json, created_at)
        VALUES(?, ?, ?, ?, ?, ?)
      `).run(newDbId, view.name, view.type, Number(view.position ?? index), view.config_json || '{}', ts);
    });

    /* Restore records */
    const recordIdMap = new Map();
    const upsertValue = db.prepare(`
      INSERT INTO record_values(record_id, property_id, value_json)
      VALUES(?, ?, ?)
      ON CONFLICT(record_id, property_id) DO UPDATE SET value_json = excluded.value_json
    `);

    const pendingRelationLinks = [];

    (payload.records || []).forEach(rec => {
      const recResult = db.prepare(`
        INSERT INTO records(database_id, created_at, updated_at)
        VALUES(?, ?, ?)
      `).run(newDbId, rec.createdAt || ts, rec.updatedAt || ts);
      const newRecordId = Number(recResult.lastInsertRowid);
      recordIdMap.set(rec.id, newRecordId);

      /* Insert values mapping old prop id -> new prop id */
      extractRecordValuesForRestore(rec, payload.properties).forEach(([oldPropId, value]) => {
        const oldPropNumericId = Number(oldPropId || 0);
        const restoredProp = restoredPropByOldId.get(oldPropNumericId);
        if (!restoredProp || value === undefined) return;

        const normalizedValue = normalizeImportedRecordValue(restoredProp.type, value);
        if (restoredProp.type === 'relation') {
          pendingRelationLinks.push({
            newRecordId,
            newPropId: restoredProp.id,
            oldRelatedRecordIds: Array.isArray(normalizedValue) ? normalizedValue : [],
          });
          upsertValue.run(newRecordId, restoredProp.id, JSON.stringify([]));
          return;
        }

        upsertValue.run(newRecordId, restoredProp.id, JSON.stringify(normalizedValue));
      });
    });

    pendingRelationLinks.forEach(link => {
      const mappedIds = [...new Set((link.oldRelatedRecordIds || [])
        .map(oldId => recordIdMap.get(oldId))
        .filter(Boolean))];
      upsertValue.run(link.newRecordId, link.newPropId, JSON.stringify(mappedIds));
    });

    /* Restore attachment records */
    (payload.attachments || []).forEach(att => {
      const newRecordId = recordIdMap.get(att.record_id);
      const newPropId = propIdMap.get(att.property_id);
      if (!newRecordId || !newPropId) return;

      /* Rewrite storage_path to point to the new db */
      const fileName = path.basename(att.storage_path);
      const newStorageDir = `db_${newDbId}/record_${newRecordId}/property_${newPropId}`;
      const newStoragePath = `${newStorageDir}/${fileName}`;

      /* Copy file only from extracted backup payload */
      const srcAbs = extractedFilesRoot ? path.join(extractedFilesRoot, att.storage_path) : '';
      const destDir = path.join(UPLOADS_DIR, newStorageDir);
      const destAbs = path.join(UPLOADS_DIR, newStoragePath);

      if (srcAbs && fs.existsSync(srcAbs)) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(srcAbs, destAbs);
      }

      db.prepare(`
        INSERT INTO attachments(database_id, record_id, property_id, file_name, storage_path, mime_type, size_bytes, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newDbId, newRecordId, newPropId, att.file_name, newStoragePath, att.mime_type || 'application/octet-stream', att.size_bytes || 0, ts);
    });

    emitWebhookEvent('database.restored', {
      databaseId: newDbId,
      sourceName: String(srcDb.name || ''),
      recordsCount: Array.isArray(payload.records) ? payload.records.length : 0,
      propertiesCount: Array.isArray(payload.properties) ? payload.properties.length : 0,
    });

    res.json({ ok: true, databaseId: newDbId, message: 'Base de datos restaurada correctamente' });
  } catch (err) {
    console.error('[RESTORE ERROR]', err);
    res.status(500).json({ error: 'Error al restaurar la base de datos: ' + err.message });
  } finally {
    if (req.file?.path) fs.rmSync(req.file.path, { force: true });
    if (extractedTempDir) fs.rmSync(extractedTempDir, { recursive: true, force: true });
  }
});

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function clearDirectoryContents(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.forEach(entry => {
    const abs = path.join(dirPath, entry.name);
    fs.rmSync(abs, { recursive: true, force: true });
  });
}

function clearPortfolioData() {
  const clearDataTx = db.transaction(() => {
    db.exec('PRAGMA foreign_keys = OFF');
    try {
      db.exec(`
        DELETE FROM attachments;
        DELETE FROM record_values;
        DELETE FROM records;
        DELETE FROM database_views;
        DELETE FROM properties;
        DELETE FROM databases;
        DELETE FROM folders;
        DELETE FROM webhook_deliveries;
        DELETE FROM app_settings;
        DELETE FROM sqlite_sequence;
      `);
    } finally {
      db.exec('PRAGMA foreign_keys = ON');
    }
  });

  clearDataTx();

  clearDirectoryContents(UPLOADS_DIR);
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const tmpRestoreDir = path.join(DATA_DIR, 'tmp_restore');
  clearDirectoryContents(tmpRestoreDir);
  fs.mkdirSync(tmpRestoreDir, { recursive: true });

  if (fs.existsSync(DATA_DIR)) {
    const tempDirs = fs.readdirSync(DATA_DIR, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && /^tmp_full_restore_\d+$/.test(entry.name));
    tempDirs.forEach(entry => {
      fs.rmSync(path.join(DATA_DIR, entry.name), { recursive: true, force: true });
    });
  }

  db.pragma('wal_checkpoint(TRUNCATE)');
  db.exec('VACUUM');
}

function parseBackupPropertyConfig(prop) {
  if (!prop) return {};
  if (typeof prop.config_json === 'string') return parseJson(prop.config_json, {});
  if (prop.config_json && typeof prop.config_json === 'object') return prop.config_json;
  if (prop.config && typeof prop.config === 'object') return prop.config;
  return {};
}

function normalizeImportedSelectItem(item) {
  if (item === null || item === undefined) return null;
  if (typeof item === 'object') {
    const candidate = item.label ?? item.value ?? item.name ?? item.title;
    const text = String(candidate || '').trim();
    return text || null;
  }
  const text = String(item).trim();
  return text || null;
}

function normalizeImportedRecordValue(propType, rawValue) {
  if (propType === 'checkbox') return Boolean(rawValue);

  if (propType === 'singleSelect') {
    const source = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    return normalizeImportedSelectItem(source);
  }

  if (propType === 'multiSelect') {
    if (Array.isArray(rawValue)) {
      return [...new Set(rawValue.map(normalizeImportedSelectItem).filter(Boolean))];
    }
    const single = normalizeImportedSelectItem(rawValue);
    return single ? [single] : [];
  }

  if (propType === 'relation') {
    if (!Array.isArray(rawValue)) return [];
    return [...new Set(rawValue.map(value => Number(value)).filter(Boolean))];
  }

  if (propType === 'rollup') return [];
  return rawValue;
}

function extractRecordValuesForRestore(record, backupProperties) {
  if (record && record.valuesById && typeof record.valuesById === 'object') {
    return Object.entries(record.valuesById);
  }

  const fallback = record && typeof record.values === 'object' ? record.values : null;
  if (!fallback) return [];

  const byId = new Map();
  const byKey = new Map();
  const byNormalizedName = new Map();

  (backupProperties || []).forEach(prop => {
    const propId = Number(prop?.id || 0);
    if (!propId) return;
    byId.set(String(propId), prop);
    byId.set(`${propId}`, prop);
    byKey.set(String(prop.key || '').toLowerCase(), prop);
    byNormalizedName.set(normalizeKey(prop.name || ''), prop);
  });

  const resolved = [];
  Object.entries(fallback).forEach(([rawKey, value]) => {
    const key = String(rawKey || '').trim();
    if (!key) return;

    let prop = byId.get(key);
    if (!prop) prop = byKey.get(key.toLowerCase());
    if (!prop) prop = byNormalizedName.get(normalizeKey(key));
    if (!prop) return;

    resolved.push([String(prop.id), value]);
  });

  return resolved;
}

app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    databasePath: DB_PATH,
    uploadsPath: UPLOADS_DIR,
    uptimeSec: Math.round(process.uptime()),
  });
});

app.post('/api/danger/purge-all', (_req, res) => {
  try {
    clearPortfolioData();
    emitWebhookEvent('portfolio.purged', {
      purgedAt: nowIso(),
    });
    res.json({ ok: true, message: 'Todos los datos fueron eliminados correctamente' });
  } catch (error) {
    console.error('[PURGE ERROR]', error);
    res.status(500).json({ error: 'Error al eliminar los datos: ' + error.message });
  }
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = error.message || 'Error interno';
  console.error('[ERROR]', message);
  res.status(status).json({ error: message });
});

app.listen(PORT, HOST, () => {
  console.log(`[BOOT] dubyDB dinámico escuchando en http://${HOST}:${PORT}`);
  console.log(`[BOOT] SQLite: ${DB_PATH}`);
  console.log(`[BOOT] Uploads: ${UPLOADS_DIR}`);
});
