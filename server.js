
/**
 * Project Beautyland API
 * @author Roy Lu(royvbtw)
 */

const express = require('express');
const bodyParser = require('body-parser');

const config = require('./config/main.config');
//const DatabaseService = require('./services/database-service');

let logSettings = {};
if(config.env === 'production'){
  logSettings = [
    {level: config.LOG_LEVEL, path: './log/index.log'}, 
    {level: 'error', path: './log/error.log'}
  ];
}else{
  logSettings = [{level: 'debug', stream: process.stdout}];
}

const log = require('bunyan').createLogger({
  name: 'accesslog',
  streams: logSettings
});

//(async function init(){
async function createServer(port){
  try{
    console.log('createServer() started.');
    log.info('App started.');
    const app = express();
    //log.info('App started.#1');
    app.use(express.static(__dirname + '/public'));
    //log.info('App started#2');

    // setup CORS middleware
    const cors = require('cors');
    app.use(cors());
    //log.info('createServer(): before dbservice()');
    //await DatabaseService();	// init for DatabaseService
    //log.info('createServer(): after dbservice()');
    
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(require('./controllers/routers'));

    log.info('createServer() init finished.');
    
    return app.listen(port = 3004, function(){
      log.info(`Beautyland-API is listening on ${port}`);
    });
  }catch(ex){
    log.error({args: arguments, ex: ex.stack}, 'Error in index.init()');
  }
}
//})();

module.exports = createServer;