FROM node:22-slim AS build

WORKDIR /app

# Копируем только манифесты для кэширования этого слоя Docker
COPY package*.json ./

# Выполняем "чистую" установку:
# --no-audit отключает долгую проверку безопасности
# --no-fund отключает вывод просьб о донатах
# --registry явно указывает рабочий DNS реестра, если локальный сбоит
RUN npm ci --no-audit --no-fund --registry=https://registry.npmjs.org/

# Копируем исходный код (убедитесь, что у вас настроен .dockerignore)
COPY . .

# Собираем production-билд
RUN npm run build

FROM nginx:1.27-alpine

# Копируем кастомный конфиг Nginx
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf

# Копируем готовые статические файлы из стадии build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]