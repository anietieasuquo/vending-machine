FROM node:21
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json ./
COPY .env ./
RUN yarn install --frozen-lockfile
COPY dist/esm/ .
EXPOSE 3000
CMD ["node", "index.js"]
