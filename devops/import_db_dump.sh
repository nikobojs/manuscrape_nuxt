#!/usr/bin/env bash

# retrieve destination db string
printf "Enter postgres connection string: "
read connection_string

echo "Restoring pg_dump 'manuscrape.dump'..."
pg_restore --verbose --clean --no-acl --no-owner -d $connection_string manuscrape.dump
