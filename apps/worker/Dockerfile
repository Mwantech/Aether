FROM node:20-alpine

# Install Docker CLI (for Docker-in-Docker or socket binding) and Git
RUN apk add --no-cache docker-cli git

WORKDIR /app

COPY package.json .
COPY apps/worker/package.json apps/worker/
# Copy other workspace package.json files if needed for hoisting, or just copy lockfile
COPY package-lock.json .

# Install dependencies (this might need tuning for monorepo)
# For simplicity in this POC, we assume we can install just for worker or copy node_modules
# A better approach for monorepo Dockerfile is using turbo prune
RUN npm install

COPY apps/worker apps/worker/
COPY apps/api/src/lib/prisma.ts apps/api/src/lib/ # If shared code exists

WORKDIR /app/apps/worker

CMD ["npm", "start"]
