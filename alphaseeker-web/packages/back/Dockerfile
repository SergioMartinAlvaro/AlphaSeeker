
# Use official Node.js image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and verify structure
# Note: Since this is a monorepo, we might need to be careful.
# But for simplicity, we treat "packages/back" as standalone if dependencies allow.
# If it relies on shared packages, we'd need a different approach.
# Assuming standalone for now or copying root.

# Let's try to keep it simple and assume standard npm install inside works
COPY package*.json ./

# Install app dependencies
RUN npm install --only=production

# Copy source
COPY . .

# Build standard TS
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD [ "npm", "start" ]
