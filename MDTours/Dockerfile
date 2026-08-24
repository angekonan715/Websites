FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN mkdir -p data/uploads/images data/uploads/video data/uploads/background
RUN npm run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["sh", "-c", "mkdir -p data/uploads/images data/uploads/video data/uploads/background && npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
