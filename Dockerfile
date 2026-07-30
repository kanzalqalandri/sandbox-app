FROM node:22-alpine

# No dependencies to install: the app is plain node:http, so the build is a copy
# and nothing in CI reaches out to a package registry.
WORKDIR /app
COPY package.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
USER node

CMD ["node", "src/server.js"]
