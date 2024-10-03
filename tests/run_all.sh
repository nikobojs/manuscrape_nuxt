#!/usr/bin/env bash

set -e
# set -x # uncomment to watch all executed commands

. .env

export DATABASE_URL=$TEST_DATABASE_URL
export DATABASE_TYPE=$TEST_DATABASE_TYPE

if [ "$DATABASE_TYPE" = "postgres" ]; then
  echo "> dropping existing database $DATABASE_URL.."
  eval "$PG_PSQL $PG_DATABASE_ADMIN_URL -c \"DROP DATABASE $PG_DATABASE_NAME\"" | true;
  
  echo "> creating a new test database.."
  psql $PG_DATABASE_ADMIN_URL -c "CREATE DATABASE manuscrape_test_0";
  
  MIGRATE_CMD="migrate-postgres"
fi
if [ "$DATABASE_TYPE" = "mssql" ]; then
  echo "> dropping existing database $DATABASE_URL.."
  sqlcmd -S 192.168.0.65 -U SA -P Leonleon1 -Q "drop database manuscrape_test_0;" | true;

  echo "> creating a new test database.."
  sqlcmd -S 192.168.0.65 -U SA -P Leonleon1 -Q "create database manuscrape_test_0;"

  MIGRATE_CMD="migrate-mssql"
fi

echo "> running migrations in test database (yarn $MIGRATE_CMD).."
eval " DATABASE_URL=\"$DATABASE_URL\" DATABASE_TYPE=$DATABASE_TYPE yarn $MIGRATE_CMD"

echo "> running tests.."
eval "yarn test"