# frontend/Dockerfile

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the app
RUN npm run build

# Serve with Vite preview (or use nginx for production)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]