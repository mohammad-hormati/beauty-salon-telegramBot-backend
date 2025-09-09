FROM node:23

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x ./entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./entrypoint.sh"]

CMD ["npx", "nodemon", "--watch", "src/**/*.ts", "--exec", "tsx", "src/server.ts"]

