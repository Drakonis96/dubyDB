const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./test-helpers');

test('relations and rollups behave like Notion basics', async () => {
  const harness = await startTestServer('dubydb-test-', 7400);
  const { api } = harness;

  try {
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
    const stderr = harness.stderrRef();
    const stdout = harness.stdoutRef();
    await harness.stop();
    assert.equal(stderr.includes('EADDRINUSE'), false, `Unexpected server bind conflict:\n${stderr}\n${stdout}`);
  }
});
