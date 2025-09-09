#!/bin/sh

echo "⏳ Waiting for database at $DATABASE_URL..."
until npx prisma db push; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "🚀 Running migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run prisma db seed || true

echo "🚀 Starting the app..."
exec "$@"