FROM node:20-alpine as build

WORKDIR /app

ARG VITE_CODEGEN_HASURA_ENDPOINT

ENV VITE_CODEGEN_HASURA_ENDPOINT=$VITE_CODEGEN_HASURA_ENDPOINT

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN echo "export const HTTP_URL = '$VITE_CODEGEN_HASURA_ENDPOINT';" > /app/src/config.ts && \
    echo "export const WS_URL = HTTP_URL.replace(/^https:\/\//,'wss://');" >> /app/src/config.ts

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]



