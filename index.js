
/**
 * Project Beautyland API
 * Entry point
 * @author Roy Lu
 */

'use strict';

var debug = require('debug')('app');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

const config = require('./config/main.config');
var DatabaseService = require('./database-service');

const PORT = config.port;

let logSettings = {};
if(config.env === 'production'){
  logSettings = [
    {level: config.LOG_LEVEL, path: 'log/index.log'}, 
    {level: 'error', path: 'log/error.log'}
  ];
}else{
	logSettings = [{level: 'debug', stream: process.stdout}];
}

var log = require('bunyan').createLogger({
  name: 'accesslog',
  streams: logSettings
});

app.use(express.static(__dirname + '/public'));

// set up CORS middleware
var cors = require('cors');
app.use(cors());

(async function init(){
	try{
		log.info('App started.');
		let dbService = await DatabaseService();	// init for DatabaseService
		
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(require('./routers'));
		
		app.listen(PORT, function(){
			log.info(`Beautyland is listening on ${PORT}`);
		});
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in index.init()');
	}
})();