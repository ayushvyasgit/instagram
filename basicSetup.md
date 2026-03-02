# setup the nginx tls 

mkdir ssl

openssl req -x509 -nodes -days 365 \
-newkey rsa:2048 \
-keyout ssl/local.key \
-out ssl/local.crt \
-subj "/C=IN/ST=KA/L=Bangalore/O=Dev/CN=localhost"