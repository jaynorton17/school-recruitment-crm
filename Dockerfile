# Build stage
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production server using NGINX
FROM nginx:stable-alpine

# Set up NGINX to listen on Cloud Run's required port (8080)
COPY default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
