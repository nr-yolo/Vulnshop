FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable for host
ENV HOST=0.0.0.0

# Start development server
CMD ["npm", "start"]
