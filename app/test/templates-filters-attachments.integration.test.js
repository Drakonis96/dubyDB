const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./test-helpers');

test('templates, grouped filters, analysis insights, and multi-attachment uploads work together', async () => {
  const harness = await startTestServer('dubydb-product-test-', 7600);
  const { api, baseUrl } = harness;

  try {
    const created = await api('/api/databases', 'POST', {
      name: 'Sales Pipeline',
      templateKey: 'simpleCrm',
    });

    const dbFull = await api(`/api/databases/${created.id}`);
    const stageProp = dbFull.properties.find(prop => prop.name === 'Etapa');
    const followUpProp = dbFull.properties.find(prop => prop.name === 'Siguiente contacto');
    const attachmentProp = dbFull.properties.find(prop => prop.name === 'Adjuntos');

    assert.ok(stageProp, 'Expected template to create stage property');
    assert.ok(followUpProp, 'Expected template to create follow-up date property');
    assert.ok(attachmentProp, 'Expected template to create attachment property');

    const tableView = dbFull.views.find(view => view.type === 'table');
    assert.equal(tableView?.config?.criteria?.groupByPropertyId, stageProp.id, 'Expected template view to group by stage');

    const leadA = await api(`/api/databases/${created.id}/records`, 'POST', {
      values: {
        titulo: 'Acme',
        etapa: 'Nuevo',
        siguiente_contacto: '2026-03-10',
      },
    });
    await api(`/api/databases/${created.id}/records`, 'POST', {
      values: {
        titulo: 'Globex',
        etapa: 'Ganado',
        siguiente_contacto: '2026-03-18',
      },
    });
    await api(`/api/databases/${created.id}/records`, 'POST', {
      values: {
        titulo: 'Initech',
        etapa: 'Perdido',
        siguiente_contacto: '2026-04-04',
      },
    });

    const stageFilters = encodeURIComponent(JSON.stringify({
      logic: 'or',
      groups: [
        { logic: 'and', rules: [{ propertyId: stageProp.id, operator: 'equals', value: 'Ganado' }] },
        { logic: 'and', rules: [{ propertyId: stageProp.id, operator: 'equals', value: 'Perdido' }] },
      ],
    }));
    const groupedRecords = await api(`/api/databases/${created.id}/records?filters=${stageFilters}`);
    assert.equal(groupedRecords.total, 2, 'Expected OR filter groups to return two matching leads');

    const dateFilters = encodeURIComponent(JSON.stringify({
      logic: 'and',
      groups: [
        { logic: 'and', rules: [{ propertyId: followUpProp.id, operator: 'between', value: '2026-03-01', valueTo: '2026-03-31' }] },
      ],
    }));
    const dateRangeRecords = await api(`/api/databases/${created.id}/records?filters=${dateFilters}`);
    assert.equal(dateRangeRecords.total, 2, 'Expected between operator to keep March follow-ups only');

    const analysis = await api(`/api/databases/${created.id}/analysis`, 'POST', {
      xPropertyId: stageProp.id,
      timelinePropertyId: followUpProp.id,
      filters: {
        logic: 'or',
        groups: [
          { logic: 'and', rules: [{ propertyId: stageProp.id, operator: 'equals', value: 'Ganado' }] },
          { logic: 'and', rules: [{ propertyId: stageProp.id, operator: 'equals', value: 'Perdido' }] },
        ],
      },
    });
    assert.equal(analysis.insights.totalRecords, 2, 'Expected analysis to honor grouped filters');
    assert.ok(analysis.insights.categoryCounts.items.some(item => item.label === 'Ganado' && item.count === 1));
    assert.ok(Array.isArray(analysis.insights.nullsByField) && analysis.insights.nullsByField.length > 0);

    const form = new FormData();
    form.append('files', new Blob(['proposal one'], { type: 'text/plain' }), 'proposal-1.txt');
    form.append('files', new Blob(['proposal two'], { type: 'text/plain' }), 'proposal-2.txt');
    const uploadResponse = await fetch(`${baseUrl}/api/records/${leadA.id}/attachments/${attachmentProp.id}`, {
      method: 'POST',
      body: form,
    });
    const uploadPayload = await uploadResponse.json();
    assert.equal(uploadResponse.ok, true, `Expected upload response to be ok, got: ${JSON.stringify(uploadPayload)}`);
    assert.equal(uploadPayload.count, 2, 'Expected multi-upload route to persist both files');

    const attachments = await api(`/api/records/${leadA.id}/attachments`);
    assert.equal(attachments.length, 2, 'Expected both uploaded attachments to be listed');
  } finally {
    const stderr = harness.stderrRef();
    const stdout = harness.stdoutRef();
    await harness.stop();
    assert.equal(stderr.includes('EADDRINUSE'), false, `Unexpected server bind conflict:\n${stderr}\n${stdout}`);
  }
});
