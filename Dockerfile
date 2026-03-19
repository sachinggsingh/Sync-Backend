FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund --ignore-scripts

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S sachin -u 1001

WORKDIR /app

COPY --from=builder --chown=sachin:nodejs /app/dist ./dist
COPY --from=builder --chown=sachin:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sachin:nodejs /app/package.json ./

ENV NODE_ENV=production

RUN mkdir -p /app/logs && chown -R sachin:nodejs /app

USER sachin

EXPOSE 5555

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:5555/health', r => process.exit(r.statusCode===200?0:1))"

CMD ["node", "dist/index.js"]