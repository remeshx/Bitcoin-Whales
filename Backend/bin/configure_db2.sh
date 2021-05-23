#!/bin/bash

echo "Configuring DATABASE btcdb"

export PGPASSWORD="btcpass"

dropdb -U btcuser btcdb
createdb -U btcuser btcdb

psql -U btcuser btcdb < ./bin/sql/config2.sql

echo "btcdb configured"