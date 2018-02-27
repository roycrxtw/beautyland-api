# deploy/after-install.sh
#!/bin/bash
source ~/.profile
cd /srv/www/beautyland-api
npm cache clean
npm install
sudo chown -R ubuntu /srv/www/beautyland-api
sudo chgrp -R ubuntu /srv/www/beautyland-api
chmod -R 755 /srv/www/beautyland-api
sudo mkdir log
touch ./log/accesslog.log
pm2 start /srv/www/beautyland-api/index.js --name='beautyland-api'
