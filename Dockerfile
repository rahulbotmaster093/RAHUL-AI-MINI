FROM node:18-alpine

# Install build dependencies required for native packages and Baileys
RUN apk add --no-cache git python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
