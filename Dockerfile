FROM node:alpine
ADD . /baibai-server
WORKDIR /baibai-server
RUN npm install
CMD ["npm", "start"]
