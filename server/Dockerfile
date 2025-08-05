FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Remove any existing lock files
RUN rm -f yarn.lock pnpm-lock.yaml package-lock.json

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["node", "index.js"]
