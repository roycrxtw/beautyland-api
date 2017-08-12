
/**
 * Project Beautyland
 * @author Roy Lu
 */

'use strict';

var debug = require('debug')('main');
var request = require('request');
var cheerio = require('cheerio');

var preloadList = require('./preload-list');
var dbService = require('./database-service').getInstance('main-service');

var config = require('./config/main.config');
var defaultPageSize = Number(config.defaultPageSize);

var log = require('bunyan').createLogger({
	name: 'accesslog',
	streams: [
        {level: config.LOG_LEVEL, path: 'log/main.log'}, 
        {level: 'error', path: 'log/error.log'}
    ]
});

const BASE_URL = 'https://www.ptt.cc';
const BORDER_URL = 'https://www.ptt.cc/bbs/Beauty/';

var daemon = null;


(async function callDaemon(){
	try{
		log.info('main-service.callDaemon() started.');
		if(!daemon){
			daemon = require('child_process').fork(__dirname + '/daemon.js');
			daemon.on('message', async function(m){
				if(m.cmd === 'update-preloadList'){
					await preloadList.update();
				}
			});
		}
	}catch(ex){
		log.error({ex: ex.stack}, 'Error in main-service.callDaemon()');
	}
})();


/**
 * Main handler for a request to index page
 * @param {number} page 
 */
async function getIndexPage(page = 1){
	page = parseInt(page);
	try{
		log.info('getIndexPage() started. page=%s', page);
		if(page < 0 || page === NaN){
			page = 1;
		}
		if(page <= 2){		// preloadList is a cached post list.
			return preloadList.getList(page).posts;
		}else{
			let skip = (page - 1) * defaultPageSize;
			let posts = await dbService.readPosts({skip: skip, size: defaultPageSize});
			return posts;
		}
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getIndexPage()');
	}
}


/**
 * #todo
 * Serve trends page for routers.
 * @param {number} period Preiod of trends. It only accepts 3 values: 1, 3 and 7
 */
async function getTrendsPage({period = 1, page = 1} = {}){
	period = parseInt(period);
	page = parseInt(page);
	if( period >=1 && period <= 7 ){
		try{
			var offset = new Date().setDate(new Date().getDate() - period);
			let posts = await dbService.readPosts({
				query: {createdAt: {$gte: new Date(offset)}},
				order: {clickCount: -1},
				size: 10
			});
			return posts;
		}catch(ex){
			log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getTrendsPage()');
		}
	}else{
		throw new Error('Invalid period value.');
	}
}

module.exports.getIndexPage = getIndexPage;
module.exports.getTrendsPage = getTrendsPage;