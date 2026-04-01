FROM node:20-alpine AS build
WORKDIR /app

COPY package.json yarn.lock* ./
COPY backend/package.json backend/package.json
RUN yarn install --non-interactive

COPY tsconfig.base.json ./
COPY backend ./backend
RUN yarn workspace backend build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock* ./
COPY backend/package.json backend/package.json
RUN yarn install --production --non-interactive

COPY --from=build /app/backend/dist ./backend/dist
WORKDIR /app/backend

EXPOSE 3001
CMD ["node", "dist/index.js"]
