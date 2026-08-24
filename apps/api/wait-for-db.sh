#!/bin/sh
until python -c "import psycopg2; psycopg2.connect(dbname='$DB_NAME', user='$DB_USER', password='$DB_PASSWORD', host='$DB_HOST')" 2>/dev/null; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "PostgreSQL is ready!"
exec "$@"
