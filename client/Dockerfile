# Etapa 1: Build
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Serve con Nginx
FROM nginx:alpine
# Copiamos la configuración que creamos arriba
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiamos solo los archivos estáticos desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
