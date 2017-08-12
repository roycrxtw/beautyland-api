
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


(async function init(){
	try{
		let dbService = await DatabaseService();	// init for DatabaseService

		let preloadList = require('./preload-list');
		await preloadList.update();

		app.use(require('./routers'));
		app.use(express.static(__dirname + '/public'));

		app.listen(PORT, function(){
			console.log('Beautyland is listening on %s', PORT);
		});
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in index.init()');
	}
})();