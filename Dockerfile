FROM node:16.20.2-slim

RUN echo "Update OS"
RUN apt-get update

#RUN echo "Install make & g++"
#RUN apk add --no-cache make
#RUN apk add --no-cache g++
#RUN apk add --no-cache vips vips-dev fftw-dev build-base
#
#RUN echo "Install python3 and pip"
#RUN apk add --no-cache python3 py3-pip

WORKDIR /usr/src/app

RUN echo "Copying all files"
COPY . .

RUN echo "Installing dependencies"
RUN npm install

EXPOSE 3004

RUN echo "Starting server"
CMD ["npm", "start"]
