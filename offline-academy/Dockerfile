# 1. Use Node.js official image
FROM node:20-alpine

# 2. Set working directory inside container
WORKDIR /app

# 3. Copy package files first (for caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy rest of the project
COPY . .

# 6. Build Next.js app
RUN npm run build

# 7. Expose Next.js port
EXPOSE 3000

# 8. Start Next.js app
CMD ["npm", "run", "start"]
