<br />

<a href="https://github.com/nikobojs/manuscrape_electron">
<picture>
  <source media="(prefers-color-scheme: light)" srcset="/public/logo/manuscrape-logo-dark.svg">
  <source media="(prefers-color-scheme: dark)" srcset="/public/logo/manuscrape-logo-light.svg">
  <img width="250" alt="Manuscape logo" src="/public/logo/manuscrape-logo-light.svg">
</picture>
</a>
<br />
<br />

With [ManuScrape](https://manuscrape.org) your can collect, enrich and export research observations containing media files. 

> This is the ManuScrape server-side app that contains a browser application and a JSON API. [Here is the client-side app repository](https://github.com/nikobojs/manuscrape_electron).

<br />

## Hosting

At the moment, [Code Collective ApS](codecollective.dk) is hosting the latest stable version free of charge at [app.manuscrape.org](https://app.manuscrape.org). However, there is no promise on continuous hosting, and in general, it is recommended that you host the backend yourself. If you do that, you won't need any third-party data processors.

<br />

## Development guide

- Fork repositories
- Look for TODO-comments or assign yourself to a Github issue
- Make improvement
- Make PR

The PR will be reviewed by the community and eventually make it into app.manuscrape.org. Visit [manuscrape.org](https://manuscrape.org) to read more about the team and community.


#### 1. Install dependencies

Install npm dependencies and add the pre commit hook. The pre-commit hook ensures you cannot commit badly typed code.

```bash
yarn install
./devops/add_pre_commit_hook.sh
```

#### 2. Run database and file storage services

Use docker and docker-compose to get services up and running quickly. The current docker-compose spins up two services:

- a postgres service called 'db' on port 5500
- a MinIO service called 'minio' (s3 api-compatible storage)

These services work with the related variables in `.env.example`. If you want to use external instances of MinIO and PostgreSQL, you can skip this step.

Run database and fileserver using docker-compose:

```bash
docker-compose up
```

#### 3. Create .env file

```bash
cp .env.example .env
```

Edit the environment file according to your system. (TODO: document the individual environment variables)

#### 4. Migrate database

Whenever there are changes in the database schema (`prisma/schema.prisma`), you can migrate the database using the [prisma cli](https://www.prisma.io/docs/reference/api-reference/command-reference), or by using the yarn script:

```bash
yarn migrate
```

#### 5. Run tests

The testing suite is in development, and is currently primarily consisting of e2e tests, using [Vitest](https://vitest.dev/).

> Check `package.json` for useful testing commands.

Run the tests to ensure you are setup, and ready for solving issues!
```bash
yarn test
```

#### 6. Run development server ⚡

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.
Start the development server on `http://localhost:3000`:

```bash
yarn dev
```

<br />

## Run production build

Build the application for production:

```bash
yarn build
```

Locally preview production build:

```bash
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
