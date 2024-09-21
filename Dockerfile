FROM node:alpine 
WORKDIR /app 
COPY package.json .
ARG NODE_ENV
RUN if [ "$NODE_ENV" = "development" ]; \
    then npm i; \
    else npm i --only=production; \
    fi
COPY . .
CMD ["npm", "run", "start:dev"]