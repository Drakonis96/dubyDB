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
      // retry
    }
    await sleep(150);
  }
  throw new Error(`Server did not become healthy at ${baseUrl} within ${timeoutMs}ms`);
}

function createApi(baseUrl) {
  return async function api(pathname, method = 'GET', body, options = {}) {
    const headers = {
      ...(options.headers || {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    };
    const response = await fetch(`${baseUrl}${pathname}`, {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`${method} ${pathname} -> ${response.status}: ${JSON.stringify(payload)}`);
    }
    return payload;
  };
}

async function startTestServer(prefix = 'dubydb-test-', portBase = 7400) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const dataDir = path.join(tempRoot, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const port = portBase + Math.floor(Math.random() * 200);
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

  await waitForHealth(baseUrl);

  return {
    tempRoot,
    dataDir,
    baseUrl,
    api: createApi(baseUrl),
    stdoutRef: () => stdout,
    stderrRef: () => stderr,
    async stop() {
      if (!serverProcess.killed) {
        serverProcess.kill('SIGTERM');
        await sleep(120);
        if (!serverProcess.killed) serverProcess.kill('SIGKILL');
      }
      fs.rmSync(tempRoot, { recursive: true, force: true });
    },
  };
}

module.exports = {
  sleep,
  waitForHealth,
  createApi,
  startTestServer,
};
