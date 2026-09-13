FROM node:22-bookworm-slim

WORKDIR /opt/lb-api
COPY apps/lb-api/package.json apps/lb-api/package-lock.json ./
RUN npm install --ignore-scripts && npm cache clean --force

WORKDIR /workspace/apps/lb-api
