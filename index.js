
/**
 * Project Beautyland API
 * Entry point
 * @author Roy Lu(royxnatw)
 */

const server = require('./server');

const config = require('./config/main.config');
const PORT = config.port;

let daemonService = null;

let logSettings = (config.env === 'production')? [
  {level: config.LOG_LEVEL, path: 'log/db.log'}, 
  {level: 'error', path: 'log/error.log'}
]: [
  {level: 'debug', stream: process.stdout},
  {level: 'debug', path: 'log/dev-debug.log'},
  {level: 'error', path: 'log/dev-error.log'},
];
const log = require('bunyan').createLogger({
  name: 'index',
  streams: logSettings
});


(async function callDaemon(){
  try{
    log.info('index.callDaemon() started.');
    if(!daemonService){
      log.info('index.callDaemon(): fork a daemon process.');
      daemonService = require('child_process').fork(__dirname + '/services/daemon.js');
      // daemonService.on('message', async function(m){
      //   if(m.cmd === 'update-preloadList'){
      //     updatePreloadList();
      //   }
      // });
    }
  }catch(ex){
    log.error({ex: ex.stack}, 'Error in index.callDaemon()');
  }
})();


server(PORT);
