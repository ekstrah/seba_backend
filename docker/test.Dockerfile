FROM node:22.17.1
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "test:api"]