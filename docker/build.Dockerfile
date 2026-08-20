# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

# NOTE: this command can be used to create a build:
#   `NODE_ENV=production docker buildx build -f ./docker/build.Dockerfile --target export --output type=tar,dest=build.tar --build-arg NODE_ENV .`

WORKDIR /app

# Copy lock files first for layer caching
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile

# Copy source
COPY . .

# Declare ARGs — each matching a host env var you want to pass through.
# During `docker buildx build`, pass them with `--build-arg VAR=$VAR`.
ARG NODE_ENV
ARG SENTRY_DSN
# ...add more as needed

# Promote to ENV so your build scripts / framework can read them
ENV NODE_ENV=${NODE_ENV}

RUN yarn build

# Minimal export stage — only the build artifacts
FROM scratch AS export
COPY --from=builder /app/.output /
