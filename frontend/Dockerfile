FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_SHOW_DEMO_CREDENTIALS=false
ENV VITE_SHOW_DEMO_CREDENTIALS=$VITE_SHOW_DEMO_CREDENTIALS

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
RUN find /usr/share/nginx/html -type f -name ".gitkeep" -delete
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Directorio para los archivos subidos por el CMS (volumen compartido con backend).
# Se monta en runtime desde docker-compose con el volumen `tivit-media`.
RUN mkdir -p /usr/share/nginx/html/media-cms

EXPOSE 8080

CMD ["/start.sh"]
