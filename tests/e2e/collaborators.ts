import { describe, test, expect } from 'vitest';
import { testProject, withTempUser, createProject, patchCollaborator, invite, getMe, removeCollaborator, deleteUser, withTempProject } from './helpers';
import { daysInFuture } from '../../utils/datetime';
import { db } from './helpers';

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
        { email: 'invitationtest@codecollective.dk' },
      );
      const inviteRes2 = await invite(
        token,
        projectId,
        { email: 'invitationtest@codecollective.dk' },
      );

      expect(inviteRes.status).toBe(201);
      expect(inviteRes2.status).toBe(409);
    });
  });

  test('project owner can remove collaborator', async () =>  {
    const collaboratorEmail = 'collaborator-0@codecollective.dk';
    await withTempProject(async (_user, project, _obs, tokenA) => {
      const inviteRes = await invite(
        tokenA,
        project.id,
        { email: collaboratorEmail },
      );
      expect(inviteRes.status).toBe(201);
      await withTempUser(async (user2, tokenB) => {
        expect(user2.projectAccess.length).toBe(1);

        // try remove collaborator
        const res = await removeCollaborator(tokenA, project.id, user2.id);
        expect(res.status).toBe(200);
      }, collaboratorEmail);
    });
  });

  test('remove collaborator returns 400 or 404 on bad user id', async () =>  {
    const collaboratorEmail = 'collaborator-1@codecollective.dk';
    await withTempProject(async (_user, project, _obs, token) => {
      const inviteRes = await invite(
        token,
        project.id,
        { email: collaboratorEmail },
      );
      expect(inviteRes.status).toBe(201);
      await withTempUser(async (user2) => {
        expect(user2.projectAccess.length).toBe(1);

        // try remove collaborator
        const resA = await removeCollaborator(token, project.id, user2.id + '1213');
        expect(resA.status).toBe(400);
        const resB = await removeCollaborator(token, project.id, 'abcd1ef');
        expect(resB.status).toBe(400);
        const resC = await removeCollaborator(token, project.id, '');
        expect(resC.status).toBe(404);
      }, collaboratorEmail);
    });
  });

  test('user cannot remove other collaborators if user is collaborator', async () =>  {
    const collaboratorEmail0 = 'collaborator-2-1@codecollective.dk';
    const collaboratorEmail1 = 'collaborator-2-2@codecollective.dk';
    // create project
    await withTempProject(async (_user, project, _obs, token) => {

      // invite two collaborators
      const inviteRes0 = await invite(
        token,
        project.id,
        { email: collaboratorEmail0 },
      );
      expect(inviteRes0.status).toBe(201);
      const inviteRes1 = await invite(
        token,
        project.id,
        { email: collaboratorEmail1 },
      );
      expect(inviteRes1.status).toBe(201);


      // create user and let one try to remove the other
      await withTempUser(async (user0) => {
        expect(user0.projectAccess.length).toBe(1);
        await withTempUser(async (user1, tokenA) => {
          expect(user1.projectAccess.length).toBe(1);
          const res = await removeCollaborator(tokenA, project.id, user0.id);
          expect(res.status).toBe(403);
        }, collaboratorEmail1);
      }, collaboratorEmail0);
    });
  });

  test('collaborator can remove herself as collaborator', async () =>  {
    const collaboratorEmail = 'collaborator-3@codecollective.dk';
    // create project manager and project
    await withTempProject(async (_user, project, _obs, token) => {
      // invite collaborator
      const inviteRes = await invite(
        token,
        project.id,
        { email: collaboratorEmail },
      );
      expect(inviteRes.status).toBe(201);

      // sign up as collaborator
      await withTempUser(async (user2, tokenA) => {
        expect(user2.projectAccess.length).toBe(1);

        // let the collaborator remove herself
        const res = await removeCollaborator(tokenA, project.id, user2.id);
        expect(res.status).toBe(200);

        // ensure collaborator lost access (has access to 0 projects)
        const meRes = await getMe(tokenA);
        const me = await meRes.json();
        expect(me.projectAccess?.length).toBe(0);
      }, collaboratorEmail);
    });
  });

  test('owner can patch collaborator', async () =>  {
    const collaboratorEmail = 'collaborator-3@codecollective.dk';
    // create project manager and project
    await withTempProject(async (_user, project, _obs, token) => {
      // invite collaborator
      const inviteRes = await invite(
        token,
        project.id,
        { email: collaboratorEmail },
      );
      expect(inviteRes.status).toBe(201);

      // sign up as collaborator
      await withTempUser(async (user2, tokenA) => {
        expect(user2.projectAccess.length).toBe(1);

        const patchRes = await patchCollaborator(token, project.id, user2.id, { role: 'OWNER' });
        expect(patchRes.status).toBe(200);

        // expect user2 now has OWNER permissions
        const meRes = await getMe(tokenA);
        const me = await meRes.json();
        expect(me.projectAccess?.length).toBe(1);
        expect(me.projectAccess[0].role).toBe('OWNER');
      }, collaboratorEmail);
    });
  });

  test('collaborator cannot patch collaborator (missing permissions)', async () =>  {
    const collaboratorEmail = 'collaborator-3@codecollective.dk';
    // create project manager and project
    await withTempProject(async (user, project, _obs, token) => {
      // invite collaborator
      const inviteRes = await invite(
        token,
        project.id,
        { email: collaboratorEmail },
      );
      expect(inviteRes.status).toBe(201);

      // sign up as collaborator
      await withTempUser(async (user2, tokenA) => {
        expect(user2.projectAccess.length).toBe(1);

        const patchRes = await patchCollaborator(tokenA, user.id, project.id, { role: 'INVITED' });
        expect(patchRes.status).toBe(403);
      }, collaboratorEmail);
    });
  });


  test('when invited user signs up, she gets automatic access to projects', async () =>  {
    const inviteEmail = 'invitationtest-1@codecollective.dk'
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
    const inviteEmail = 'invitationtest-2@codecollective.dk'
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
    const inviteEmail = 'invitationtest-3@codecollective.dk'
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
      await db.projectInvitation.updateMany({
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
      await db.projectInvitation.updateMany({
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
    const inviteEmail = 'invitationtest-4@codecollective.dk'
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
      await db.projectInvitation.updateMany({
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