#Base Image node:12.18.4-alpine
FROM node:16.14.0-alpine
#Set working directory to /app
WORKDIR /app
#Set PATH /app/node_modules/.bin
ENV PATH /app/node_modules/.bin:$PATH
#Copy package.json in the image
COPY package.json ./

#Install Packages
RUN npm install
RUN npm install firebase-admin

#Copy the app
COPY . ./
#Expose application port
EXPOSE 8000

#Start the app
CMD ["node", "index.js"]