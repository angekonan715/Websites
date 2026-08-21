FROM node:20-bookworm-slim

WORKDIR /app

COPY MDTours/package.json MDTours/package-lock.json ./
RUN npm ci

COPY MDTours/ ./
RUN npm run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
