# ---- Этап 1: Сборка приложения ----
FROM node:20-alpine AS builder
LABEL stage="nextjs-builder"
WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN echo "Listing /app contents:" && ls -la /app
RUN echo "Listing /app/node_modules/@tailwindcss contents:" && ls -la /app/node_modules/@tailwindcss || echo "@tailwindcss not found"
RUN echo "Contents of postcss.config.mjs:" && cat /app/postcss.config.mjs

ENV NODE_ENV=production
RUN npm run build

# ---- Этап 2: Production-образ ----
FROM node:20-alpine AS runner
LABEL stage="nextjs-runner"
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts 

EXPOSE 3000
CMD ["npm", "run", "start"]
