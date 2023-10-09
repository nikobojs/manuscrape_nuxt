#!/usr/bin/env bash

# remove existing backup file
rm -f manuscrape.dump

# retrieve db string
printf "Enter postgres connection string: "
read connection_string

# try download database
echo "Downloading database..."
pg_dump -Fc -d $connection_string --no-acl --no-owner --clean > manuscrape.dump
