
import { describe, test, expect } from 'vitest';
import { login, signup, expectRedirect, withTempUser, openSignUpPage, openLoginPage, openIndexPage, deleteUser, createProject, getMe, inviteToProject } from './helpers';

describe('Pages not requiring auth', async () => {
  test('login page returns 200', async () => {
    const res = await openLoginPage();
    expect(res.status).toBe(200);
  });
  test('signup page returns 200', async () => {
    const res = await openSignUpPage();
    expect(res.status).toBe(200);
  });
});

describe('Pages requiring auth', async () => {
  test('/ returns 302 to /login', async () => {
    const res = await openIndexPage();
    expectRedirect(res, '/login');
  });
});

describe('Log in api endpoint', async () => {
  test('returns 400 on empty payload', async () => {
    const res = await login({})
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json?.statusMessage).toContain('is required');
  });

  test('returns "Email required" when only sending password', async () => {
    const res = await login({
      email: '',
      password: 'copycat'
    });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json?.statusMessage).toBe('Email is required');
  });

  test('takes more than 100ms bad payload', async () => {
    const before = new Date();
    const res = await login({
      email: 'asd@asd.asd',
      password: (Math.random()*40000).toString(),
    });
    expect(res.status).oneOf([403, 409]);
    const json = await res.json();
    expect(json?.statusMessage).toBe('User does not exist');
    const after = new Date();
    expect(
      after.getTime() - before.getTime(),
      'Response time should take at least 100ms'
    ).toBeGreaterThanOrEqual(100);
  });
});

describe('Sign up endpoint', async () => {
  test('returns 400 on empty payload', async () => {
    const res = await signup({})
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json?.statusMessage).toContain('is required');
  });

  test('returns "Email required" when only sending password', async () => {
    const res = await signup({
      email: '',
      password: 'copycat'
    });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json?.statusMessage).toBe('Email is required');
  });

  test('takes more than 100ms on good payload', async () => {
    const before = new Date();
    await withTempUser(async () => {
      const after = new Date();
      expect(
        after.getTime() - before.getTime(),
        'Response time should take at least 100ms'
      ).toBeGreaterThanOrEqual(100);
    })
  });

  test('takes more than 100ms on bad payload', async () => {
    const before = new Date();
    const res = await signup({
      email: '',
    });
    expect(res.status).toBe(400);
    const after = new Date();
    expect(
      after.getTime() - before.getTime(),
      'Response time should take at least 100ms'
    ).toBeGreaterThanOrEqual(100);
  });


  test('doesn\'t accept very stupid passwords', async () => {
    const badPasswords = [
      'asd',
      'a',
      '',
      'aaaaaaaaaaaaaaaaaaaa',
      '123456789',
      'aaaa1'
    ];

    for (let pw of badPasswords) {
      const res = await signup({
        email: 'nfb+test-0@codecollective.dk',
        password: pw
      });

      const json = await res.json()
      expect(
        res.status,
        `Bad password '${pw}' was not rejected by api:` + json?.statusMessage
      ).toBe(400);
    }
  });


  test('doesn\'t accept invalid emails', async () => {
    const badEmails = [
      'asd',
      'a',
      '',
      'aaaaaaaaaaaaaaaaaaaa',
      '123456789',
      'aaaa1',
      'aaaa1@',
      'aaaa1@asdasd',
      '@aaaa1@asdasd',
      '@.aaaa1@asdasd',
      '.aaaa1@asdasd',
      'aaaa1@.',
    ];

    for (let email of badEmails) {
      const res = await signup({
        email,
        password: 'Password123'
      });

      const json = await res.json()
      expect(
        res.status,
        `Bad email '${email}' was not rejected by api: ` + json?.statusMessage
      ).toBe(400);
    }
  });


  test('doesn\'t accept duplicate emails', async () => {
    const email = 'nfb+test-0@codecollective.dk';
    const password = 'abcd1234';

    await withTempUser(async (user: CurrentUser) => {
      expect(user?.email).toBe(email)
      const res = await signup({
        email,
        password,
      });
      const json = await res.json();
      expect(res.status, json?.statusMessage).toBe(409);
    }, email, password);
  });
});
