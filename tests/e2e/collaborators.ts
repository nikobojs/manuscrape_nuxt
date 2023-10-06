import { describe, test, expect } from 'vitest';
import { testProject, withTempUser, createProject, invite, getMe, fetchObservations, openProjectPage, inviteToProject, signup, deleteUser } from './helpers';
import { prisma } from './helpers';
import { daysInFuture } from '../../utils/datetime';

describe('Collaborators', () => {
  test('project owner can invite a unique email 1 time', async () =>  {
    await withTempUser(async (_user, token) => {
      const res = await createProject(token, testProject);
      const json = await res.json();
      expect(res.status, json?.statusMessage).toBe(201);
      expect(Object.keys(json)).toContain('id');
      expect(typeof json['id']).toBe('number');
      const projectId: number = json['id'];
      const inviteRes = await invite(
        token,
        projectId,
        { email: 'invitationtest@codecolective.dk' },
      );
      const inviteRes2 = await invite(
        token,
        projectId,
        { email: 'invitationtest@codecolective.dk' },
      );

      expect(inviteRes.status).toBe(201);
      expect(inviteRes2.status).toBe(409);
    });
  });

  test('when invited user signs up, she gets automatic access to projects', async () =>  {
    const inviteEmail = 'invitationtest-1@codecolective.dk'
    await withTempUser(async (_user, token) => {
      const res = await createProject(token, testProject);
      const json = await res.json();

      expect(res.status, json?.statusMessage).toBe(201);
      expect(Object.keys(json)).toContain('id');
      expect(typeof json['id']).toBe('number');
      const projectId: number = json['id'];
      const inviteRes = await invite(
        token,
        projectId,
        { email: inviteEmail },
      );
      expect(inviteRes.status).toBe(201);

      await withTempUser(async (user2, token) => {
        expect(user2.projectAccess.length).toBe(1);
        expect(user2.projectAccess[0].project?.id).toBe(projectId);
      }, inviteEmail);
    });
  });

  test('invited user gets immediate access if already a manuscrape user', async () =>  {
    const inviteEmail = 'invitationtest-2@codecolective.dk'
    await withTempUser(async (_user, token) => {
      const res = await createProject(token, testProject);
      const json = await res.json();

      expect(res.status, json?.statusMessage).toBe(201);
      expect(Object.keys(json)).toContain('id');
      expect(typeof json['id']).toBe('number');
      const projectId: number = json['id'];

      await withTempUser(async (_user2, token2) => {
        const inviteRes = await invite(
          token,
          projectId,
          { email: inviteEmail },
        );
        expect(inviteRes.status).toBe(202);
        
        const user2Res = await getMe(token2);
        expect(user2Res.status).toBe(200);
        const json = await user2Res.json();
        expect(Object.keys(json)).toContain('projectAccess')
        const access = json['projectAccess'];
        expect(Array.isArray(access)).toBe(true)
        expect(access.length).toBe(1);
        expect(access[0].project?.id).toBe(projectId);
      }, inviteEmail);
    });
  });

  test('invitations work with the expiration param', async () =>  {
    const inviteEmail = 'invitationtest-3@codecolective.dk'
    await withTempUser(async (_user, token) => {
      const res = await createProject(token, testProject);
      const json = await res.json();

      expect(res.status, json?.statusMessage).toBe(201);
      expect(Object.keys(json)).toContain('id');
      expect(typeof json['id']).toBe('number');
      const projectId: number = json['id'];

      const inviteRes = await invite(
        token,
        projectId,
        { email: inviteEmail },
      );
      expect(inviteRes.status).toBe(201);

      // set expiration date back to ten days ago
      await prisma.projectInvitation.updateMany({
        where: { projectId },
        data: {
          expiresAt: daysInFuture(-10),
        },
      });

      // accept invite and expect it to be invalid
      await withTempUser(async (user2, user2token) => {
        expect(Object.keys(user2)).toContain('projectAccess');
        const access = user2.projectAccess;
        expect(Array.isArray(access)).toBe(true)
        expect(access.length).toBe(0);
        // delete user
        await deleteUser(user2token, { password: 'Password123' })
      }, inviteEmail);

      // set expiration date 20 days in future
      await prisma.projectInvitation.updateMany({
        where: { projectId },
        data: {
          expiresAt: daysInFuture(20),
        },
      });

      // signup invited and expect user to have access to project
      await withTempUser(async (user2) => {
        expect(Object.keys(user2)).toContain('projectAccess');
        const access = user2.projectAccess;
        expect(Array.isArray(access)).toBe(true)
        expect(access.length).toBe(1);
        expect(access[0].project?.id).toBe(projectId);
      }, inviteEmail);
    });
  });

  test('expired invitations wont affect newer invitations', async () =>  {
    const inviteEmail = 'invitationtest-4@codecolective.dk'
    await withTempUser(async (_user, token) => {
      const res = await createProject(token, testProject);
      const json = await res.json();

      expect(res.status, json?.statusMessage).toBe(201);
      expect(Object.keys(json)).toContain('id');
      expect(typeof json['id']).toBe('number');
      const projectId: number = json['id'];

      const inviteRes = await invite(
        token,
        projectId,
        { email: inviteEmail },
      );
      expect(inviteRes.status).toBe(201);

      // set expiration date back to ten days ago
      await prisma.projectInvitation.updateMany({
        where: { projectId },
        data: {
          expiresAt: daysInFuture(-10),
        },
      });

      // accept invite and expect user not to have access to project (invitation expired)
      await withTempUser(async (user2, token2) => {
        expect(Object.keys(user2)).toContain('projectAccess');
        const access = user2.projectAccess;
        expect(Array.isArray(access)).toBe(true)
        expect(access.length).toBe(0);

        // create a new invitation
        const invite2Res = await invite(
          token,
          projectId,
          { email: inviteEmail },
        );
        // expect 202 - user should get access immediatly
        expect(invite2Res.status).toBe(202);

        // expect user has access, when refetching projects (via. getMe)
        const meRes = await getMe(token2);
        expect(meRes.status).toBe(200);
        const meJson = await meRes.json();
        const accessAfter = meJson.projectAccess;
        expect(Array.isArray(accessAfter)).toBe(true)
        expect(accessAfter.length).toBe(1);
        expect(accessAfter[0].project?.id).toBe(projectId);
      }, inviteEmail);
    });
  });
});