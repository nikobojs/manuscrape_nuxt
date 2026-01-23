#!/usr/bin/env bash

set -e
# set -x # uncomment to watch all executed commands

echo "> calling `yarn install` to patch old deps"
yarn install

. .env

export LOG_HTTP_REQUESTS=false
export PG_DATABASE_URL=$PG_TEST_DATABASE_URL
export TEST_DATABASE_TYPE=postgres
export DATABASE_TYPE=postgres

eval "yarn compile-prisma"

echo "> dropping existing database $PG_DATABASE_URL.."
eval "$PG_TEST_PSQL $PG_TEST_DATABASE_ADMIN_URL -c \"DROP DATABASE $PG_TEST_DATABASE_NAME\"" | true;

echo "> creating a new test database.."
psql $PG_TEST_DATABASE_ADMIN_URL -c "CREATE DATABASE $PG_TEST_DATABASE_NAME";

echo "> running migrations in test database (yarn $MIGRATE_CMD).."
eval " DATABASE_URL=\"$PG_DATABASE_URL\" DATABASE_TYPE=postgres yarn migrate-postgres"

echo "> running tests.."
eval "yarn test"