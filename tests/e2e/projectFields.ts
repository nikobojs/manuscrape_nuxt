import { describe, test, expect } from 'vitest';
import {
  withTempProject,
  withTempUser,
  getMe,
  invite,
  patchField,
  moveField
} from './helpers';

describe('Project fields', () => {

  test('project owner can patch field label', async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf('number');

      // ensure project has a field with a valid id
      const fieldId = project.fields?.[0]?.id;
      expect(fieldId).toBeTypeOf('number');

      // patch field
      const label = 'test-1234-label';
      const res = await patchField(token, projectId, fieldId, { label });
      expect(res.status).toBe(204);

      // refetch project
      const meRes = await getMe(token);
      const meJson = await meRes.json();
      const updatedProject = meJson?.projectAccess?.find((a: any) => a.projectId === projectId)?.project as FullProject;
      expect(updatedProject).toBeTruthy();

      // verify field was updated
      const updatedField = updatedProject.fields.find(f => f.id === fieldId);
      expect(updatedField).toBeTruthy();
      expect(updatedField?.label).toBe(label)
    });
  });

  test('collaborator gets 401 when patching field label', async () => {
    const collaboratorEmail = 'collaborator-patch-field-0@codecollective.dk';

    await withTempProject(async (user, project, _obs, token) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf('number');

      // ensure project has a field with a valid id
      const fieldId = project.fields?.[0]?.id;
      expect(fieldId).toBeTypeOf('number');

      // invite future collaborator
      const inviteRes = await invite(
        token,
        project.id,
        { email: collaboratorEmail },
      );
      expect(inviteRes.status).toBe(201);

      await withTempUser(async (user2, tokenB) => {
        // patch field as collaborator
        const label = 'test-1234-label';
        const res = await patchField(tokenB, projectId, fieldId, { label });
        expect(res.status).toBe(403);

        // refetch project as collaborator
        const meRes = await getMe(tokenB);
        const meJson = await meRes.json();
        const updatedProject = meJson?.projectAccess?.find((a: any) => a.projectId === projectId)?.project as FullProject;
        expect(updatedProject).toBeTruthy();

        // verify field exists but wasn't updated
        const updatedField = updatedProject.fields.find(f => f.id === fieldId);
        expect(updatedField).toBeTruthy();
        expect(updatedField?.label).not.toBe(label)
      }, collaboratorEmail);
    });
  });

  test('a wrong project field index patch fixes itself', async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // ensure projectId is a number
      const projectId = project.id;
      expect(projectId).toBeTypeOf('number');

      // ensure project has a field with a valid id
      const fieldId = project.fields?.[0]?.id;
      expect(fieldId).toBeTypeOf('number');

      // patch field
      const index = 999;
      const res = await patchField(token, projectId, fieldId, { index });
      expect(res.status).toBe(204);

      // refetch project
      const meRes = await getMe(token);
      const meJson = await meRes.json();
      const updatedProject = meJson?.projectAccess?.find((a: any) => a.projectId === projectId)?.project as FullProject;
      expect(updatedProject).toBeTruthy();

      // verify field was updated and corrected to amount of fields minus one
      const updatedField = updatedProject.fields.find(f => f.id === fieldId);
      expect(updatedField).toBeTruthy();
      expect(updatedField?.index).toBe(project.fields.length - 1);
    });
  });

  test('no user can patch other users\' project fields', async () => {
    await withTempUser(async (user1, token1) => {
      await withTempProject(async (user2, project, _obs, token2) => {
        // ensure project has a field with a valid id
        const fieldId = project.fields?.[0]?.id;
        expect(fieldId).toBeTypeOf('number');

        // patch project as user1 and expect 403
        const label = 'abcdefg';
        const res = await patchField(token1, project.id, fieldId, { label });
        expect(res.status).toBe(403);
      });
    });
  });

  test('empty project field patch returns 400', async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // ensure project has a field with a valid id
      const fieldId = project.fields?.[0]?.id;
      expect(fieldId).toBeTypeOf('number');

      // patch project with an empty object
      const res = await patchField(token, project.id, fieldId, {});
      expect(res.status).toBe(400);
    });
  });

  test('can move top project field down', async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // sort fields by index and retrieve top and bot field
      const sortedFields = project.fields.sort((a, b) => a.index > b.index ? 1 : -1);
      const topField = sortedFields[0];
      const botField = sortedFields[sortedFields.length - 1];

      // expect the sorting to be working as expected (top field has lowest index)
      expect(topField.index).toBeLessThan(botField.index);

      // try moving field downwards and expect success
      const res = await moveField(token, project.id, topField.id, { up: false });
      expect(res.status).toBe(204);
    });
  });

  test('cannot move top project field up', async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // sort fields by index and retrieve top field
      const sortedFields = project.fields.sort((a, b) => a.index > b.index ? 1 : -1);
      const topField = sortedFields[0];

      // patch project with an empty object
      const res = await moveField(token, project.id, topField.id, { up: true });
      expect(res.status).toBe(400);
    });
  });


  test('can move bot project field up', async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // sort fields by index and retrieve top and bot field
      const sortedFields = project.fields.sort((a, b) => a.index > b.index ? 1 : -1);
      const botField = sortedFields[sortedFields.length - 1];

      // try moving field downwards and expect success
      const res = await moveField(token, project.id, botField.id, { up: true });
      expect(res.status).toBe(204);
    });
  });

  test('cannot move bot project field down', async () => {
    await withTempProject(async (user, project, _obs, token) => {
      // sort fields by index and retrieve top field
      const sortedFields = project.fields.sort((a, b) => a.index > b.index ? 1 : -1);
      const botField = sortedFields[sortedFields.length - 1];

      // patch project with an empty object
      const res = await moveField(token, project.id, botField.id, { up: false });
      expect(res.status).toBe(400);
    });
  });
});