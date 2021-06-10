FROM node:12-alpine
ENV NODE_ENV=production

WORKDIR /src

COPY ["package.json", "package-lock.json*", "./"]

RUN apk add --no-cache make gcc g++ python && \
  npm install && \
  npm rebuild bcrypt --build-from-source && \
  apk del make gcc g++ python
RUN apk add --no-cache bash

COPY . .

CMD [ "node", "app.js" ]
