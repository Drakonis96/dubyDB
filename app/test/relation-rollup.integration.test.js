const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHealth(baseUrl, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.ok) return;
    } catch (_error) {
      // ignore and retry
    }
    await sleep(150);
  }
  throw new Error(`Server did not become healthy at ${baseUrl} within ${timeoutMs}ms`);
}

function createApi(baseUrl) {
  return async function api(pathname, method = 'GET', body) {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`${method} ${pathname} -> ${response.status}: ${JSON.stringify(payload)}`);
    }
    return payload;
  };
}

test('relations and rollups behave like Notion basics', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dubydb-test-'));
  const dataDir = path.join(tempRoot, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const port = 7400 + Math.floor(Math.random() * 200);
  const baseUrl = `http://127.0.0.1:${port}`;

  const serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      DATA_DIR: dataDir,
      DB_PATH: path.join(dataDir, 'test.db'),
      UPLOADS_DIR: path.join(dataDir, 'uploads'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  serverProcess.stdout.on('data', chunk => { stdout += String(chunk); });
  serverProcess.stderr.on('data', chunk => { stderr += String(chunk); });

  const stopServer = async () => {
    if (!serverProcess.killed) {
      serverProcess.kill('SIGTERM');
      await sleep(120);
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }
  };

  try {
    await waitForHealth(baseUrl);
    const api = createApi(baseUrl);

    const dbProjects = await api('/api/databases', 'POST', { name: 'Projects' });
    const dbTasks = await api('/api/databases', 'POST', { name: 'Tasks' });

    const relationProp = await api(`/api/databases/${dbProjects.id}/properties`, 'POST', {
      name: 'Tasks Relation',
      type: 'relation',
      config: {
        relatedDatabaseId: dbTasks.id,
        showOnRelatedDatabase: true,
        reciprocalPropertyName: 'Project',
      },
    });

    const projectDbFull = await api(`/api/databases/${dbProjects.id}`);
    const taskDbFull = await api(`/api/databases/${dbTasks.id}`);

    const projectRelation = projectDbFull.properties.find(prop => prop.id === relationProp.id);
    assert.ok(projectRelation, 'Expected relation property to exist in projects DB');
    assert.equal(projectRelation.type, 'relation');
    assert.equal(projectRelation.config.relatedDatabaseId, dbTasks.id);
    assert.ok(projectRelation.config.reciprocalPropertyId, 'Expected reciprocal property id in relation config');

    const taskReciprocalRelation = taskDbFull.properties.find(prop => prop.id === projectRelation.config.reciprocalPropertyId);
    assert.ok(taskReciprocalRelation, 'Expected reciprocal relation property in tasks DB');
    assert.equal(taskReciprocalRelation.type, 'relation');

    const taskHoursProperty = await api(`/api/databases/${dbTasks.id}/properties`, 'POST', {
      name: 'Hours',
      type: 'text',
    });

    const relatedProps = await api(`/api/properties/${projectRelation.id}/related-properties`);
    const relatedHours = relatedProps.find(prop => prop.id === taskHoursProperty.id);
    assert.ok(relatedHours, 'Expected related properties endpoint to include target DB properties');

    await api(`/api/databases/${dbProjects.id}/properties`, 'POST', {
      name: 'Total Hours',
      type: 'rollup',
      config: {
        relationPropertyId: projectRelation.id,
        relatedPropertyId: taskHoursProperty.id,
        calculate: 'sum',
      },
    });

    const projectsWithRollup = await api(`/api/databases/${dbProjects.id}`);
    const rollupProp = projectsWithRollup.properties.find(prop => prop.type === 'rollup' && prop.name === 'Total Hours');
    assert.ok(rollupProp, 'Expected rollup property to be created');

    const projectRecord = await api(`/api/databases/${dbProjects.id}/records`, 'POST', {
      values: { titulo: 'Project Alpha' },
    });

    const task1 = await api(`/api/databases/${dbTasks.id}/records`, 'POST', {
      values: { titulo: 'Task 1', hours: '2' },
    });

    const task2 = await api(`/api/databases/${dbTasks.id}/records`, 'POST', {
      values: { titulo: 'Task 2', hours: '3' },
    });

    await api(`/api/records/${projectRecord.id}`, 'PUT', {
      values: {
        [projectRelation.key]: [task1.id, task2.id],
      },
    });

    const projectRecordsAfterLink = await api(`/api/databases/${dbProjects.id}/records`);
    const projectRow = projectRecordsAfterLink.data.find(row => row.id === projectRecord.id);
    assert.ok(projectRow, 'Expected created project record');
    assert.equal(Number(projectRow.values[rollupProp.key]), 5, 'Expected rollup sum to be 5');

    const taskRecordsAfterLink = await api(`/api/databases/${dbTasks.id}/records`);
    const taskRow1 = taskRecordsAfterLink.data.find(row => row.id === task1.id);
    const taskRow2 = taskRecordsAfterLink.data.find(row => row.id === task2.id);

    assert.deepEqual(taskRow1.values[taskReciprocalRelation.key], [projectRecord.id]);
    assert.deepEqual(taskRow2.values[taskReciprocalRelation.key], [projectRecord.id]);

    await api(`/api/records/${projectRecord.id}`, 'DELETE');

    const taskRecordsAfterDelete = await api(`/api/databases/${dbTasks.id}/records`);
    const taskRow1AfterDelete = taskRecordsAfterDelete.data.find(row => row.id === task1.id);
    const taskRow2AfterDelete = taskRecordsAfterDelete.data.find(row => row.id === task2.id);

    assert.deepEqual(taskRow1AfterDelete.values[taskReciprocalRelation.key], []);
    assert.deepEqual(taskRow2AfterDelete.values[taskReciprocalRelation.key], []);
  } finally {
    await stopServer();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  assert.equal(stderr.includes('EADDRINUSE'), false, `Unexpected server bind conflict:\n${stderr}\n${stdout}`);
});
