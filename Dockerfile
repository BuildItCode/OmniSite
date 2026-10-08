FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY *.html *.css *.js version.txt ./
COPY assets/ ./assets/
COPY scripts/ ./scripts/
RUN npm run build && npm run check

FROM nginx:stable-alpine

# Railway overrides PORT; 8080 also works for local Docker runs.
ENV PORT=8080
ENV NGINX_ENVSUBST_FILTER=^PORT$

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/*.html /app/*.css /app/site.js /app/landing.js /app/docs.js /app/version.txt /usr/share/nginx/html/
COPY --from=build /app/assets/ /usr/share/nginx/html/assets/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/healthz" || exit 1

CMD ["nginx", "-g", "daemon off;"]
