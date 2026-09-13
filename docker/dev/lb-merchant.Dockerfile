FROM node:22-bookworm-slim

WORKDIR /opt/lb-merchant
COPY apps/lb-merchant/package.json apps/lb-merchant/package-lock.json ./
RUN npm install --ignore-scripts && npm cache clean --force

WORKDIR /workspace/apps/lb-merchant
