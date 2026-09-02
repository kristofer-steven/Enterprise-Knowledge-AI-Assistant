# 1. Use Node.js 20 on Alpine Linux as the base image (~50MB, lightweight)
FROM node:20-alpine
# 2. Create /app directory inside the container and switch to it
WORKDIR /app
# 3. Copy ONLY package.json and package-lock.json into the container
COPY package*.json ./
# 4. Install dependencies based on package-lock.json
#    ci = clean install (faster & stricter than npm install)
RUN npm ci
# 5. Copy ALL remaining source files into the container
COPY . .
# 6. Compile TypeScript → JavaScript by running the "build" script
RUN npm run build
# 7. Document that this container listens on port 3001
EXPOSE 3001
# 8. Command to run when the container starts
CMD ["node", "dist/index.js"]