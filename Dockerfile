FROM node:16.17.0-alpine3.16 as builder
ARG NODE_ENV=production
ARG PORT=80
ENV NODE_ENV $NODE_ENV
ENV PORT $PORT

RUN apk update && apk upgrade
RUN apk add dumb-init libcap
COPY ./package*.json /app/
COPY ./tsconfig*.json /app/
COPY ./src /app/src
COPY ./config /app/config

WORKDIR /app

RUN npm ci --include=dev

RUN npm run build

CMD [ "tail", "-f", "/dev/null" ]
FROM node:16.17.0-alpine3.16 as runner
ARG NODE_ENV=production
ARG PORT=80
ENV NODE_ENV $NODE_ENV
ENV PORT $PORT

RUN apk update && apk upgrade
RUN apk add dumb-init libcap

COPY --from=builder /app/build ./app
COPY ./package*.json /app/

WORKDIR /app

RUN npm ci

# allow node to listen on low ports
RUN setcap 'cap_net_bind_service=+ep' /usr/local/bin/node

RUN chown -R node:node /app/
USER node

EXPOSE ${PORT}

#CMD [ "tail", "-f", "/dev/null" ]
CMD ["dumb-init", "sh","-c","node src/main.js"]
