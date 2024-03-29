# Use the official Node.js image as the base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code to the working directory
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD [ "npm", "run", "serve" ]
