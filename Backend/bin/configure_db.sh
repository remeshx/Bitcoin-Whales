#!/bin/bash

echo "Configuring DATABASE btcdb"

export PGPASSWORD="btcpass"

dropdb -U btcuser btcdb
createdb -U btcuser btcdb

psql -U btcuser btcdb < ./bin/sql/tables.sql
psql -U btcuser btcdb < ./bin/sql/settings.sql

echo "btcdb configured"