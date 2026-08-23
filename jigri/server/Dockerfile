FROM node:20-alpine
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["dumb-init", "npx", "ts-node-dev", "--respawn", "src/index.ts"]
