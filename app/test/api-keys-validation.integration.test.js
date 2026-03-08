const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./test-helpers');

async function request(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

test('api key scopes, expiry validation, data validation, and record activity are enforced', async () => {
  const harness = await startTestServer('dubydb-robust-test-', 7800);
  const { api, baseUrl } = harness;

  try {
    let result = await request(baseUrl, '/api/settings/api-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        label: 'Expired key',
        expiresAt: '2024-01-01T00:00:00.000Z',
      }),
    });
    assert.equal(result.response.status, 400, 'Expected expired API key creation to be rejected');

    const readKey = await api('/api/settings/api-keys', 'POST', {
      label: 'Reader',
      scopes: ['read'],
    });
    const writeKey = await api('/api/settings/api-keys', 'POST', {
      label: 'Writer',
      scopes: ['write'],
    });

    await api('/api/settings', 'PUT', {
      api: {
        requireApiKey: true,
      },
    });

    result = await request(baseUrl, '/api/databases');
    assert.equal(result.response.status, 401, 'Expected API to require a key after enabling protection');

    result = await request(baseUrl, '/api/databases', {
      headers: { 'x-api-key': readKey.key },
    });
    assert.equal(result.response.status, 200, 'Read-scoped key should be able to list databases');

    result = await request(baseUrl, '/api/databases', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': readKey.key,
      },
      body: JSON.stringify({ name: 'Blocked DB' }),
    });
    assert.equal(result.response.status, 403, 'Read-scoped key should not be able to create databases');

    result = await request(baseUrl, '/api/databases', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': writeKey.key,
      },
      body: JSON.stringify({ name: 'Validated DB' }),
    });
    assert.equal(result.response.status, 201, 'Write-scoped key should be able to create databases');
    const databaseId = Number(result.payload.id);
    assert.ok(databaseId > 0, 'Expected created database id');

    result = await request(baseUrl, `/api/databases/${databaseId}`, {
      headers: { 'x-api-key': writeKey.key },
    });
    assert.equal(result.response.status, 403, 'Write-scoped key should not be able to read databases');

    result = await request(baseUrl, `/api/databases/${databaseId}/properties`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': writeKey.key,
      },
      body: JSON.stringify({
        name: 'Broken relation',
        type: 'relation',
        config: { relatedDatabaseId: 999999 },
      }),
    });
    assert.equal(result.response.status, 400, 'Expected invalid relation config to be rejected');

    await request(baseUrl, `/api/databases/${databaseId}/properties`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': writeKey.key,
      },
      body: JSON.stringify({ name: 'Website', type: 'url' }),
    });
    await request(baseUrl, `/api/databases/${databaseId}/properties`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': writeKey.key,
      },
      body: JSON.stringify({ name: 'Due date', type: 'date' }),
    });
    await request(baseUrl, `/api/databases/${databaseId}/properties`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': writeKey.key,
      },
      body: JSON.stringify({ name: 'Start time', type: 'time' }),
    });

    const database = await api(`/api/databases/${databaseId}`, 'GET', undefined, {
      headers: { 'x-api-key': readKey.key },
    });
    const websiteProp = database.properties.find(prop => prop.name === 'Website');
    const dueDateProp = database.properties.find(prop => prop.name === 'Due date');
    const startTimeProp = database.properties.find(prop => prop.name === 'Start time');

    assert.ok(websiteProp && dueDateProp && startTimeProp, 'Expected validation target properties to exist');

    result = await request(baseUrl, `/api/databases/${databaseId}/records`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': writeKey.key,
      },
      body: JSON.stringify({
        values: {
          titulo: 'Broken row',
          website: 'not-a-url',
          due_date: '2026-13-40',
          start_time: '25:99',
        },
      }),
    });
    assert.equal(result.response.status, 400, 'Expected invalid record payload to be rejected');

    result = await request(baseUrl, `/api/databases/${databaseId}/records`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': writeKey.key,
      },
      body: JSON.stringify({
        values: {
          titulo: 'Valid row',
          website: 'https://example.com/docs',
          due_date: '2026-03-20',
          start_time: '09:30',
        },
      }),
    });
    assert.equal(result.response.status, 201, 'Expected valid record to be created');
    const recordId = Number(result.payload.id);

    result = await request(baseUrl, `/api/records/${recordId}/content`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': writeKey.key,
      },
      body: JSON.stringify({
        propertyId: websiteProp.id,
        value: 'https://example.com/updated',
      }),
    });
    assert.equal(result.response.status, 200, 'Expected content update to succeed');

    result = await request(baseUrl, `/api/records/${recordId}/activity`, {
      headers: { 'x-api-key': readKey.key },
    });
    assert.equal(result.response.status, 200, 'Expected read-scoped key to access activity feed');
    assert.ok(
      Array.isArray(result.payload.items) && result.payload.items.some(item => item.action === 'created'),
      'Expected activity feed to include record creation',
    );
    assert.ok(
      result.payload.items.some(item => item.action === 'content_updated'),
      'Expected activity feed to include content updates',
    );
  } finally {
    const stderr = harness.stderrRef();
    const stdout = harness.stdoutRef();
    await harness.stop();
    assert.equal(stderr.includes('EADDRINUSE'), false, `Unexpected server bind conflict:\n${stderr}\n${stdout}`);
  }
});
