# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

# NOTE: the comment below is deprecated
# NOTE: this command can be used to create a build:
# docker buildx build --progress=plain --secret "id=env,src=./.env" -f ./docker/build.Dockerfile --target export --output "type=tar,dest=output.tar" --build-arg "NODE_ENV=production" .

WORKDIR /app

COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile

COPY . .

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

# Load .env as secret, source it so all vars are exported for yarn build
# RUN --mount=type=secret,id=env,target=/run/secrets/.env \
#     set -a && . /run/secrets/.env && set +a && \
#     yarn build

# improved command that respects more advanced .env values
RUN --mount=type=secret,id=env,target=/run/secrets/.env \
    while IFS= read -r line || [ -n "$line" ]; do \
      line="${line%$'\r'}"; \
      case "$line" in ''|\#*) continue ;; esac; \
      case "$line" in export\ *) line="${line#export }" ;; esac; \
      key="${line%%=*}"; \
      value="${line#*=}"; \
      export "$key=$value"; \
    done < /run/secrets/.env && \
    yarn build

FROM scratch AS export
COPY --from=builder /app/.output /
