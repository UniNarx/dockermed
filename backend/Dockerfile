# backend/Dockerfile

# ---- Этап 1: Сборка TypeScript в JavaScript ----
FROM node:20-alpine AS builder
LABEL stage="backend-builder"
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package.json package-lock.json* ./

# Устанавливаем все зависимости (включая devDependencies для сборки)
RUN npm ci

# Копируем остальной исходный код и конфигурацию TypeScript
# .dockerignore должен исключить node_modules, dist, .env и т.д.
COPY tsconfig.json ./
# Копируем все содержимое текущей директории (контекста сборки) в /app
COPY . .

# Собираем TypeScript в JavaScript (результат будет в папке /app/dist)
RUN npm run build

# ---- Этап 2: Production-образ ----
FROM node:20-alpine AS production
LABEL stage="backend-production"
WORKDIR /app

ENV NODE_ENV=production
# Переменные окружения для работы приложения (порт, БД, секреты)
# Лучше всего устанавливать их при запуске контейнера, а не в Dockerfile
# ENV PORT=8080
# ENV MONGODB_URI=
# ENV JWT_SECRET=
# ENV FRONTEND_URL=
# ENV SUPERADMIN_USERNAME=
# ENV SUPERADMIN_PASSWORD=

# Копируем package.json и package-lock.json для установки только production-зависимостей
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Копируем скомпилированный код из этапа сборки (папку dist)
COPY --from=builder /app/dist ./dist

# Открываем порт, который слушает ваше приложение (по умолчанию 8080 из вашего config)
EXPOSE 8080

# Команда для запуска приложения
# (из вашего package.json: "start": "node dist/server/index.js")
CMD ["npm", "run", "start"]
