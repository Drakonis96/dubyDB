const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startTestServer } = require('./test-helpers');

async function request(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function startMockOpenAiProvider() {
  let modelCalls = 0;
  let completionCalls = 0;
  let lastCompletionBody = null;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');

    if (req.method === 'GET' && url.pathname === '/v1/models') {
      modelCalls += 1;
      json(res, 200, {
        data: [{ id: 'stub-model' }],
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/v1/chat/completions') {
      completionCalls += 1;
      let raw = '';
      for await (const chunk of req) raw += String(chunk);
      lastCompletionBody = raw ? JSON.parse(raw) : null;
      json(res, 200, {
        choices: [{
          message: {
            content: JSON.stringify({
              value: 'Urgente',
              newOptions: ['Urgente'],
            }),
          },
        }],
      });
      return;
    }

    json(res, 404, { error: 'Not found' });
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    modelCallsRef: () => modelCalls,
    completionCallsRef: () => completionCalls,
    lastCompletionBodyRef: () => lastCompletionBody,
    async stop() {
      await new Promise((resolve, reject) => {
        server.close(error => {
          if (error) reject(error);
          else resolve();
        });
      });
    },
  };
}

test('ai properties validate config, load provider models, and autofill records', async () => {
  const mockProvider = await startMockOpenAiProvider();
  const harness = await startTestServer('dubydb-ai-test-', 8200, {
    env: {
      OPENAI_API_BASE_URL: mockProvider.baseUrl,
    },
  });
  const { api, baseUrl } = harness;

  try {
    const createdDatabase = await api('/api/databases', 'POST', {
      name: 'AI Properties DB',
    });
    const databaseId = Number(createdDatabase.id);
    assert.ok(databaseId > 0, 'Expected created database id');

    const database = await api(`/api/databases/${databaseId}`);
    const titleProperty = database.properties.find(prop => prop.key === 'titulo');
    assert.ok(titleProperty, 'Expected default title property to exist');

    let result = await request(baseUrl, `/api/databases/${databaseId}/properties`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Invalid AI',
        type: 'text',
        config: {
          ai: {
            enabled: true,
            systemPrompt: 'Clasifica el registro.',
            contextPropertyIds: [],
            contextAttachmentPropertyIds: [],
            provider: 'openai',
            model: 'stub-model',
          },
        },
      }),
    });
    assert.equal(result.response.status, 400, 'Expected invalid AI property config to be rejected');
    assert.match(result.payload.error || '', /contexto/i);

    await api('/api/settings/ai-provider', 'POST', {
      provider: 'openai',
      apiKey: 'test-key',
      model: 'stub-model',
      active: true,
      setActive: true,
    });

    const modelsResult = await api('/api/settings/ai-provider/openai/models');
    assert.deepEqual(modelsResult.models, ['stub-model']);
    assert.equal(mockProvider.modelCallsRef(), 1, 'Expected model list to be served by the stub provider');

    await api(`/api/databases/${databaseId}/properties`, 'POST', {
      name: 'Category',
      type: 'singleSelect',
      config: {
        options: [],
        ai: {
          enabled: true,
          systemPrompt: 'Clasifica el título en una categoría corta.',
          contextPropertyIds: [titleProperty.id],
          contextAttachmentPropertyIds: [],
          provider: 'openai',
          model: 'stub-model',
          selectMode: 'allowNew',
        },
      },
    });

    const databaseWithAiProperty = await api(`/api/databases/${databaseId}`);
    const aiProperty = databaseWithAiProperty.properties.find(prop => prop.name === 'Category');
    assert.ok(aiProperty, 'Expected AI property to be created');

    const createdRecord = await api(`/api/databases/${databaseId}/records`, 'POST', {
      values: {
        titulo: 'Factura vencida',
      },
    });
    const recordId = Number(createdRecord.id);
    assert.ok(recordId > 0, 'Expected created record id');

    const generationResult = await api(`/api/properties/${aiProperty.id}/ai/generate`, 'POST', {
      recordId,
    });
    assert.equal(generationResult.ok, true);
    assert.equal(generationResult.skipped, false);
    assert.equal(generationResult.value, 'Urgente');
    assert.deepEqual(generationResult.createdOptions, ['Urgente']);
    assert.equal(generationResult.provider, 'openai');
    assert.equal(generationResult.model, 'stub-model');
    assert.equal(mockProvider.completionCallsRef(), 1, 'Expected one AI completion call');
    assert.match(JSON.stringify(mockProvider.lastCompletionBodyRef() || {}), /Factura vencida/);

    const updatedRecord = await api(`/api/records/${recordId}`);
    assert.equal(updatedRecord.values[aiProperty.key], 'Urgente', 'Expected generated value to be persisted on the record');

    const updatedDatabase = await api(`/api/databases/${databaseId}`);
    const updatedAiProperty = updatedDatabase.properties.find(prop => prop.id === aiProperty.id);
    assert.ok(
      updatedAiProperty.config.options.some(option => option.label === 'Urgente'),
      'Expected AI generation to create the missing select option',
    );

    const skippedResult = await api(`/api/properties/${aiProperty.id}/ai/generate`, 'POST', {
      recordId,
    });
    assert.equal(skippedResult.ok, true);
    assert.equal(skippedResult.skipped, true);
    assert.equal(skippedResult.reason, 'already_filled');
    assert.equal(skippedResult.value, 'Urgente');
    assert.equal(mockProvider.completionCallsRef(), 1, 'Expected existing values to be preserved without overwrite');

    const activity = await api(`/api/records/${recordId}/activity`);
    const aiActivity = activity.items.find(item => item.action === 'ai_completed');
    assert.ok(aiActivity, 'Expected record activity to include the AI completion');
    assert.equal(aiActivity.payload.provider, 'openai');
    assert.equal(aiActivity.payload.model, 'stub-model');
    assert.deepEqual(aiActivity.payload.createdOptions, ['Urgente']);
  } finally {
    const stderr = harness.stderrRef();
    const stdout = harness.stdoutRef();
    await harness.stop();
    await mockProvider.stop();
    assert.equal(stderr.includes('EADDRINUSE'), false, `Unexpected server bind conflict:\n${stderr}\n${stdout}`);
  }
});
