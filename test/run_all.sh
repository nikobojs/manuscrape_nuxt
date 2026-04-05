#!/usr/bin/env bash

set -e
# set -x # uncomment to watch all executed commands

echo "> calling `yarn install` to patch old deps"
yarn install

. .env

export LOG_HTTP_REQUESTS=false

echo "> dropping existing database $TEST_DATABASE_URL.."
eval "$PG_PSQL $PG_DATABASE_ADMIN_URL -c \"DROP DATABASE $TEST_DATABASE_NAME\"" | true;

echo "> creating a new test database.."
psql $PG_DATABASE_ADMIN_URL -c "CREATE DATABASE $TEST_DATABASE_NAME";

echo "> running migrations in test database.."
eval "DATABASE_URL=\"$TEST_DATABASE_URL\" yarn db:migrate"

echo "> running tests.."
eval "yarn test"
