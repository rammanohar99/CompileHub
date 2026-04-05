# Use Node 20 (IMPORTANT)
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# 🔥 Generate Prisma client (CRITICAL)
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start app
CMD ["node", "server.js"]