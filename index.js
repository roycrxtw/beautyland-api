
/**
 * Project Beautyland API
 * Entry point
 * @author Roy Lu(royxnatw)
 */

const server = require('./server');

const { PORT } = require('./config/main-config');
const mainService = require('services/main-service');

const log = require('services/log-service').init('index');

let daemonService = null;

(async function callDaemon() {
  try {
    log.info('index.callDaemon() started.');
    if (!daemonService) {
      log.info('index.callDaemon(): forking a daemon process.');
      daemonService = require('child_process').fork(__dirname + '/services/daemon.js');
      await mainService.init({daemon: daemonService});
    }
  } catch(ex) {
    log.error({ex: ex.stack}, 'Error in index.callDaemon()');
  }
})();

server(PORT);
