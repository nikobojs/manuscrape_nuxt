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
ManuScrape makes it very easy to collect screenshots, scrollshots and metadata about generic observations.
<br />
<br />

> If you are looking for the main ManuScrape presentation, go to the [manuscrape_electron repository](https://github.com/nikobojs/manuscrape_electron).

<br />

# Nuxt App

This is the backend repo used by the [native client side windows app](https://github.com/nikobojs/manuscrape_electron), and is hosted on [app.manuscrape.org](https://app.manuscrape.org).

<br />

## Hosting (https://app.manuscrape.org)

There is no promise on continuous hosting, and in general, it is recommended that you host the backend yourself. That can only help in making you more compliant with relevant data processing laws.

If you want ManuScrape hosted for you, feel free to contact the Copenhagen-based company, [Code Collective](https://codecollective.dk), who is currently hosting app.manuscrape.org
<br />
<br />

## Development

#### TL;DR:

Fork repositories, look for TODO-comments, make improvement, create feature branch (naming doesn't matter), commit, create PR, and done! The PR will be reviewed by the project maintainers.

#### Git conventions

Not strict in any way. We'll always figure it out so do your stuff the way you think works best. Pull requests (into "unstable" branch) on feature branches will be reviewed and merged by the current admins of the project.

#### Install dependencies

Install all the dependencies and add the pre commit hook. The pre-commit hook ensures you cannot commit badly typed code.

```bash
yarn install
./devops/add_pre_commit_hook.sh
```

#### Run external services

Install docker and docker-compose to get services up and running in seconds

- a postgres service called 'db' on port 5500 (to avoid port conflicts in case postgres is running locally)
- a MinIO service called 'minio' (s3 api-compatible storage)

```bash
docker-compose up
```

#### Migrations

Whenever you update the data structure (`prisma/schema.prisma`), you can migrate the database to the newest changes by using the [prisma cli](https://www.prisma.io/docs/reference/api-reference/command-reference), or by using the yarn script:

```bash
yarn migrate
```

Run migrations before moving on.

#### Run development server

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.
Start the development server on `http://localhost:3000`:

```bash
yarn dev
```

<br />

## Production

Build the application for production:

```bash
yarn build
```

Locally preview production build:

```bash
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
