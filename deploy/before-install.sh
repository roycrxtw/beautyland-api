# deploy/before-install
#!/bin/bash
pm2 delete beautyland-api
cp /srv/www/beautyland-api/config ~/backup/beautyland-api/
cp /srv/www/beautyland-api/log ~/backup/beautyland-api/
shopt -s extglob
rm -fr /srv/www/beautyland-api/.gitignore
rm -fr /srv/www/beautyland-api/!(config|node_modules|log)
shopt -u extglob
