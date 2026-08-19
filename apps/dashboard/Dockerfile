FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/dashboard/package.json ./
RUN npm install

COPY apps/dashboard/ ./

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
