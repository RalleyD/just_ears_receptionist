# --- Stage 1: Build --- #
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# deterministic clean dependency install
RUN npm ci

# copy the source
COPY . .

# transpile the TypeScript -> dist/index.js
RUN npm run build

# --- Stage 2: Production run --- #
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist dist/

ENV NODE_ENV=production

# this container needs to listen on a port
EXPOSE 5000

CMD ["node", "dist/index.js"]
