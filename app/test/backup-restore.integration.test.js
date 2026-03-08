const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./test-helpers');

async function request(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

test('database export/restore remaps property references and full restore replaces the portfolio snapshot', async () => {
  const harness = await startTestServer('dubydb-backup-test-', 8000);
  const { api, baseUrl } = harness;

  try {
    const created = await api('/api/databases', 'POST', {
      name: 'CRM Restore',
      templateKey: 'simpleCrm',
    });

    const originalDb = await api(`/api/databases/${created.id}`);
    const stageProp = originalDb.properties.find(prop => prop.name === 'Etapa');
    const followUpProp = originalDb.properties.find(prop => prop.name === 'Siguiente contacto');
    const attachmentProp = originalDb.properties.find(prop => prop.name === 'Adjuntos');
    const tableView = originalDb.views.find(view => view.type === 'table');

    assert.ok(stageProp && followUpProp && attachmentProp && tableView, 'Expected CRM template metadata to exist');

    const record = await api(`/api/databases/${created.id}/records`, 'POST', {
      values: {
        titulo: 'Acme Restore',
        etapa: 'Ganado',
        siguiente_contacto: '2026-03-12',
      },
    });

    const form = new FormData();
    form.append('files', new Blob(['signed proposal'], { type: 'text/plain' }), 'proposal.txt');
    let result = await request(baseUrl, `/api/records/${record.id}/attachments/${attachmentProp.id}`, {
      method: 'POST',
      body: form,
    });
    assert.equal(result.response.status, 201, 'Expected attachment upload to succeed before export');

    const exportResponse = await fetch(`${baseUrl}/api/databases/${created.id}/export?includeFiles=1`);
    assert.equal(exportResponse.ok, true, 'Expected database export ZIP to be generated');
    const exportBuffer = Buffer.from(await exportResponse.arrayBuffer());

    const restoreForm = new FormData();
    restoreForm.append('backup', new Blob([exportBuffer], { type: 'application/zip' }), 'crm-backup.zip');
    result = await request(baseUrl, '/api/restore', {
      method: 'POST',
      body: restoreForm,
    });
    assert.equal(result.response.status, 200, 'Expected database restore to succeed');
    const restoredDatabaseId = Number(result.payload.databaseId);
    assert.notEqual(restoredDatabaseId, created.id, 'Expected restored database to get a new id');

    const restoredDb = await api(`/api/databases/${restoredDatabaseId}`);
    const restoredStageProp = restoredDb.properties.find(prop => prop.name === 'Etapa');
    const restoredTableView = restoredDb.views.find(view => view.type === 'table');
    assert.ok(restoredStageProp && restoredTableView, 'Expected restored properties and views');
    assert.equal(
      restoredTableView.config?.criteria?.groupByPropertyId,
      restoredStageProp.id,
      'Expected restored view config to remap the grouped property id',
    );
    assert.notEqual(
      restoredTableView.config?.criteria?.groupByPropertyId,
      tableView.config?.criteria?.groupByPropertyId,
      'Expected restored view property references to differ from the old ids',
    );

    const restoredRecords = await api(`/api/databases/${restoredDatabaseId}/records`);
    assert.equal(restoredRecords.total, 1, 'Expected restored database to contain the exported row');
    const restoredRecord = restoredRecords.data[0];
    assert.equal(restoredRecord.values[followUpProp.key], '2026-03-12', 'Expected restored record values to survive import');

    const restoredAttachments = await api(`/api/records/${restoredRecord.id}/attachments`);
    assert.equal(restoredAttachments.length, 1, 'Expected attachment metadata to be restored');
    const attachmentDownload = await fetch(`${baseUrl}${restoredAttachments[0].downloadUrl}`);
    assert.equal(attachmentDownload.ok, true, 'Expected restored attachment binary to be downloadable');
    const attachmentText = await attachmentDownload.text();
    assert.equal(attachmentText, 'signed proposal');

    const fullBackupResponse = await fetch(`${baseUrl}/api/backup/full`);
    assert.equal(fullBackupResponse.ok, true, 'Expected full backup ZIP to be generated');
    const fullBackupBuffer = Buffer.from(await fullBackupResponse.arrayBuffer());

    const tempDb = await api('/api/databases', 'POST', { name: 'Temporary DB' });
    assert.ok(tempDb.id, 'Expected temporary database to be created');

    const fullRestoreForm = new FormData();
    fullRestoreForm.append('backup', new Blob([fullBackupBuffer], { type: 'application/zip' }), 'portfolio.zip');
    result = await request(baseUrl, '/api/backup/full/restore', {
      method: 'POST',
      body: fullRestoreForm,
    });
    assert.equal(result.response.status, 200, 'Expected full restore to succeed');

    const databasesAfterFullRestore = await api('/api/databases');
    assert.equal(
      databasesAfterFullRestore.some(item => item.name === 'Temporary DB'),
      false,
      'Expected full restore to remove databases created after the backup snapshot',
    );
    assert.equal(
      databasesAfterFullRestore.some(item => item.name === restoredDb.name),
      true,
      'Expected full restore to preserve the backed up databases',
    );
  } finally {
    const stderr = harness.stderrRef();
    const stdout = harness.stdoutRef();
    await harness.stop();
    assert.equal(stderr.includes('EADDRINUSE'), false, `Unexpected server bind conflict:\n${stderr}\n${stdout}`);
  }
});
