FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/dashboard/package.json ./
RUN npm install

COPY apps/dashboard/src/ ./src/
COPY apps/dashboard/index.html ./ 2>/dev/null || true

RUN npm run build || mkdir -p dist

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
