
/**
 * Project Beautyland
 * @author Roy Lu
 */

'use strict';

var debug = require('debug')('app');
var express = require('express');
var app = express();
const PORT = 3004;

var config = require('./config/main.config');
var DatabaseService = require('./database-service');

var log = require('bunyan').createLogger({
	name: 'accesslog',
	streams: [{
		level: config.LOG_LEVEL,
		path: 'log/main.log'
	}]
});

app.use(express.static(__dirname + '/public'));

// set up CORS
var cors = require('cors');
app.use(cors());

(async function init(){
	console.log('index.js init()');
	try{
		console.log('trying to set up database service.');
		let dbService = await DatabaseService();	// init for DatabaseService

		app.use(require('./routers'));
		

		app.listen(PORT, function(){
			console.log('Beautyland is listening on %s', PORT);
		});
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in index.init()');
	}
})();