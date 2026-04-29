FROM node:22-slim

WORKDIR /app

RUN apt-get update -qq && apt-get install --no-install-recommends -y \
  ca-certificates \
  python3 \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run download-files

CMD ["node", "agent.js", "start"]