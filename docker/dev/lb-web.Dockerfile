FROM node:22-bookworm-slim

WORKDIR /opt/lb-web
COPY apps/lb-web/package.json apps/lb-web/package-lock.json ./
RUN npm install --ignore-scripts && npm cache clean --force

WORKDIR /workspace/apps/lb-web
