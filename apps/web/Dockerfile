FROM node:20-alpine

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

WORKDIR /app

# Копируем зависимости
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Копируем код
COPY . .

# Собираем
RUN pnpm build

# Устанавливаем serve для запуска
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
