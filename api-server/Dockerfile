FROM node:14-alpine as base

WORKDIR /src
COPY package*.json ./
EXPOSE 5000

FROM base as production
ENV NODE_ENV=production
RUN npm ci
COPY . .
CMD ["node", "app.js"]

FROM base as dev
ENV NODE_ENV=development
RUN npm i
RUN npm install -g nodemon
COPY . .
CMD ["nodemon", "app.js"]