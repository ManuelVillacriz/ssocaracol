# BUILD
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# NGINX
FROM nginx:alpine

# ⚠️ ajusta el nombre de tu proyecto Angular
COPY --from=build /app/dist/bp-frontend/ /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]