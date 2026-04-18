#!/bin/sh
set -e
npx prisma db push --skip-generate --accept-data-loss
exec npx next start -p ${PORT:-3000}
