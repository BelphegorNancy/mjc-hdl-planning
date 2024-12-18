# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies without running scripts (to avoid Prisma generation)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add nginx configuration
RUN echo '\
server {\
    listen 80;\
    location /calendar {\
        alias /usr/share/nginx/html;\
        try_files $uri $uri/ /index.html;\
        index index.html;\
    }\
    location / {\
        root /usr/share/nginx/html;\
        try_files $uri $uri/ /index.html;\
    }\
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
