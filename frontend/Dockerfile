FROM node:20-alpine AS build
WORKDIR /app

COPY package.json yarn.lock* ./
COPY frontend/package.json frontend/package.json
RUN yarn install --non-interactive

COPY tsconfig.base.json ./
COPY frontend ./frontend
RUN yarn workspace frontend build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
