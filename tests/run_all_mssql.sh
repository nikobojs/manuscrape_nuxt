#!/usr/bin/env bash

set -e
set -x # uncomment to watch all executed commands

echo "> calling `yarn install` to patch old deps"
yarn install

. .env

echo ""

export LOG_HTTP_REQUESTS=true
export MSSQL_DATABASE_URL=$MSSQL_TEST_DATABASE_URL
export DATABASE_TYPE=mssql
export TEST_DATABASE_TYPE=mssql

eval "yarn compile-prisma"

echo "> dropping existing database $MSSQL_TEST_DATABASE_NAME.."
sqlcmd -S $MSSQL_TEST_HOST -U $MSSQL_TEST_USER -P $MSSQL_TEST_PASSWORD -Q "drop database $MSSQL_TEST_DATABASE_NAME;" | true;

echo "> creating a new test database $MSSQL_TEST_DATABASE_NAME.."
sqlcmd -S $MSSQL_TEST_HOST -U $MSSQL_TEST_USER -P $MSSQL_TEST_PASSWORD -Q "create database $MSSQL_TEST_DATABASE_NAME;"

MIGRATE_CMD="migrate-mssql"

echo "> running migrations in test database (yarn $MIGRATE_CMD).."
eval " MSSQL_DATABASE_URL=\"$MSSQL_TEST_DATABASE_URL\" DATABASE_TYPE=mssql yarn $MIGRATE_CMD"

echo "> running tests.."
eval "yarn test"