FROM node:22-bookworm-slim

WORKDIR /opt/lb-customer
COPY apps/lb-customer/package.json apps/lb-customer/package-lock.json ./
RUN npm install --ignore-scripts && npm cache clean --force

WORKDIR /workspace/apps/lb-customer
