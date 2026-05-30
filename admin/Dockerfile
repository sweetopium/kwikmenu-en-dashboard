FROM node:22-slim AS build

WORKDIR /workspace

COPY package*.json ./

RUN npm ci --no-audit --no-fund --registry=https://registry.npmjs.org/

COPY admin/package*.json ./admin/

WORKDIR /workspace/admin

RUN npm install --no-audit --no-fund --registry=https://registry.npmjs.org/

WORKDIR /workspace

COPY admin/ ./admin/
COPY src/ ./src/

WORKDIR /workspace/admin

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/admin/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
