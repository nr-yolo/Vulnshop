FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads/profile public/uploads/feedback public/images ../database

# Initialize database
RUN npm run init-db

# Expose port
EXPOSE 3001

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3001

# Start server
CMD ["npm", "start"]
