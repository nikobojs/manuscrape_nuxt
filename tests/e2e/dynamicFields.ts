import { describe, test, expect } from 'vitest';
import { createDynamicField, withTempProject } from './helpers';
import { FieldType } from '@prisma/client';

describe('Dynamic project fields', async () => {
  test('can create dynamic field (datetime/datetime difference)', async () => {
    await withTempProject(async (_user, project, _observations, token) => {
      const field0Id = project.fields[0].id;
      const field1Id = project.fields[1].id;
      const dynRes = await createDynamicField(token, project.id, {
        label: 'Time difference',
        operator: 'DIFF',
        field0Id,
        field1Id,
      });
      expect(dynRes.status).toBe(201);
    })
  });

  test('can create dynamic field (number/number sum)', async () => {
    await withTempProject(async (_user, project, _observations, token) => {
      const numericalTypes = [FieldType.INT, FieldType.FLOAT] as string[];
      const numFields = project.fields.filter(f => (numericalTypes).includes(f.type))
      expect(numFields.length).toBeGreaterThanOrEqual(2);
      const field0Id = numFields[0].id;
      const field1Id = numFields[1].id;
      expect(field0Id).toBeTypeOf('number');
      expect(field1Id).toBeTypeOf('number');
      expect(field0Id).not.toBe(field1Id);
      const dynRes = await createDynamicField(token, project.id, {
        label: 'one plus the other',
        operator: 'SUM',
        field0Id,
        field1Id,
      });
      const dynJson = await dynRes.json();
      expect(dynJson, JSON.stringify(dynJson, null, 2)).toHaveProperty('id')
      expect(dynRes.status).toBe(201);
    })
  });

  test('cannot create dynamic field with types datetime & text)', async () => {
    await withTempProject(async (_user, project, _observations, token) => {
      const field0Id = project.fields.find(f => f.type === FieldType.DATETIME)?.id;
      const field1Id = project.fields.find(f => f.type === FieldType.STRING)?.id;
      expect(field0Id).toBeTypeOf('number');
      expect(field1Id).toBeTypeOf('number');
      expect(field0Id).not.toBe(field1Id);
      const dynRes = await createDynamicField(token, project.id, {
        label: 'Date minus text',
        operator: 'DIFF',
        field0Id,
        field1Id,
      });
      expect(dynRes.status).toBe(400);
    })
  });

  test('gets 400 if field0Id is equal to field1Id', async () => {
    await withTempProject(async (_user, project, _observations, token) => {
      const field0Id = project.fields.find(f => f.type === FieldType.DATETIME)?.id;
      expect(field0Id).toBeTypeOf('number');
      const dynRes = await createDynamicField(token, project.id, {
        label: 'Same field id dynamic field',
        operator: 'DIFF',
        field0Id,
        field1Id: field0Id,
      });
      expect(dynRes.status).toBe(400);
    })
  });
});