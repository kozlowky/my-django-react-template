# --- STAGE 1: Build ---
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

# --- STAGE 2: Runner ---
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]