# syntax=docker/dockerfile:1
# 静态站点。vite build --mode prod.local 从镜像内 /app/.env.prod.local 读变量

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
ENV DOCKER_BUILD=1
COPY . .
RUN npm run build:prod-local

FROM nginx:1.27-alpine AS runner
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
