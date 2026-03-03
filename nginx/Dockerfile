FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/nginx.conf

# Copy custom config
COPY nginx.conf /etc/nginx/nginx.conf

# Create cache directory
RUN mkdir -p /var/cache/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]