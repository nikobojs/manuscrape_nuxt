#!/usr/bin/env bash

# stop if error
set -e

# add environment variables
. ../.env

# remove existing backup file
rm -f manuscrape.dump

# use specific pg_dump binary
read -e -p "Enter pg_dump path: " -i "$PG_TEST_DUMP" pg_dump

# retrieve db string
printf "Enter postgres connection string: "
read connection_string

# try download database
echo "Downloading database..."
$pg_dump -Fc -d $connection_string --no-acl --no-owner --clean > manuscrape.dump
