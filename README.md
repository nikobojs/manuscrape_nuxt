# ManuScrape Nuxt App

ManuScrape makes it very easy to collect screenshots, scrollshots and metadata about generic observations. This is the backend repo used by the [native client side windows app](https://github.com/nikobojs/manuscrape_electron), and is hosted on [manuscrape.org](https://manuscrape.org). There is no promise on continuous hosting, so it is recommended to host this repo on-premise. That will probably also make your use case more compliant with your local data processing laws.

## Contribute to the project

#### Install dependencies
Install all the dependencies and add the pre commit hook. The pre-commit hook ensures you cannot commit badly typed code.
```bash
yarn install
./devops/add_pre_commit_hook.sh
```

#### Run development server
Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.
Start the development server on `http://localhost:3000`:
```bash
yarn dev
```

#### Migrations
Whenever you update the data structure (`prisma/schema.prisma`), you can migrate the database to the newest changes by using the [prisma cli](https://www.prisma.io/docs/reference/api-reference/command-reference), or by using the yarn script:
```bash
yarn migrate
```


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
