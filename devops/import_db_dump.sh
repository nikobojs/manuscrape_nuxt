#!/usr/bin/env bash

# stop if error
set -e

# add environment variables
. ../.env

# retrieve destination db string
read -e -p "Enter postgres connection string: " -i "$PG_DATABASE_URL" connection_string
# use specific pg_restore binary
read -e -p "Enter pg_restore path: " -i "$PG_TEST_RESTORE" pg_restore


echo "Restoring pg_dump 'manuscrape.dump'..."
$pg_restore --verbose --clean --no-acl --no-owner -d $connection_string manuscrape.dump
