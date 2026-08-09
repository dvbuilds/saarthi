# Using the Debian-based slim image rather than alpine deliberately.
# This project has native npm modules (@napi-rs/canvas for PDF rendering,
# tesseract.js for OCR) — alpine's musl libc is a common source of subtle
# native-module breakage that's annoying to debug in a container you can't
# easily inspect. Slightly bigger image, meaningfully fewer footguns.
FROM node:20-slim

WORKDIR /app

# Baked in here, not just in docker-compose's environment block — this
# image is built with --omit=dev (excludes pino-pretty), and NODE_ENV
# needs to be "production" for logger.js to correctly skip trying to load
# that dev-only transport. If this image is ever deployed standalone
# (e.g. a direct Render Docker deploy without docker-compose), it needs
# to work without depending on compose's env overrides being present.
ENV NODE_ENV=production

# Copy manifests first so `npm ci` is only re-run when dependencies
# actually change, not on every source file edit (Docker layer caching).
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

# Default entrypoint runs the API. The worker service in docker-compose.yml
# overrides this command to run worker.js instead — same image, same
# installed node_modules, different process role.
CMD ["node", "--import", "./tracing.js", "server.js"]
