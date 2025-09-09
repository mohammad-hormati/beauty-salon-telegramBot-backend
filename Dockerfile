FROM node:23

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4000

CMD ["npx", "nodemon", "--watch", "src/**/*.ts", "--exec", "tsx", "src/server.ts"]

