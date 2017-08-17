# deploy/before-install
#!/bin/bash
pm2 delete beautyland-api
cp /var/node/beautyland-api/config ~/backup/beautyland-api/
cp /var/node/beautyland-api/log ~/backup/beautyland-api/
shopt -s extglob
rm -fr /var/node/beautyland-api/.gitignore
rm -fr /var/node/beautyland-api/!(config|node_modules|log)
shopt -u extglob
