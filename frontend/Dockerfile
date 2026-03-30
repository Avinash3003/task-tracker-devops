FROM node:20-slim AS builder

WORKDIR /frontend

COPY package*.json ./

RUN npm install 

COPY . .

ENV VITE_API_URL=/api
RUN npm run build

# ---------

FROM nginx:alpine

# Copy our custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build output
COPY --from=builder /frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
