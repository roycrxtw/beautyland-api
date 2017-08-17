# deploy/after-install.sh
#!/bin/bash
source /home/ec2-user/.bash_profile
cd /var/node/beautyland-api
npm cache clean
npm install
sudo chown -R ec2-user /var/node/beautyland-api
sudo chgrp -R ec2-user /var/node/beautyland-api
chmod -R 755 /var/node/beautyland-api
sudo mkdir log
touch ./log/accesslog.log
pm2 start /var/node/beautyland-api/index.js --name='beautyland-api'
