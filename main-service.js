
/**
 * Project Beautyland
 * Main service
 * @author Roy Lu
 * Sep 2017
 */

var preloadList = require('./preload-list');
var dbService = require('./database-service').getInstance('main-service');
//var dbService = require('./database-service')();

const config = require('./config/main.config');
const PAGE_SIZE = Number(config.defaultPageSize);

let logSettings = {};
if(config.env === 'production'){
	logSettings = [
    {level: config.LOG_LEVEL, path: 'log/main.log'}, 
    {level: 'error', path: 'log/error.log'}
  ];
}else{
  logSettings = [{level: 'debug', stream: process.stdout}];
}

var log = require('bunyan').createLogger({
  name: 'accesslog',
  streams: logSettings
});

var daemon = null;


(async function init(){
  log.info('main-service.init() started');
  await updatePreloadList();
  log.info('main-service.init() end');
})();


(async function callDaemon(){
	try{
		log.info('main-service.callDaemon() started.');
		if(!daemon){
			daemon = require('child_process').fork(__dirname + '/daemon.js');
			daemon.on('message', async function(m){
				if(m.cmd === 'update-preloadList'){
					updatePreloadList();
				}
			});
		}
	}catch(ex){
		log.error({ex: ex.stack}, 'Error in main-service.callDaemon()');
	}
})();


/**
 * Main handler for a request to index page
 * @param {number} page page number
 */
async function getIndexPage(page = 1){
	try{
		log.info(`getIndexPage() started. page=${page}`);
		page = parseInt(page, 10);
		page = (page < 0 || isNaN(page))? 1: page;

		if(page <= 2){		// preloadList is a cached post list.
			return preloadList.getList(page).posts;
		}else{
			const skip = (page - 1) * PAGE_SIZE;
			const posts = await dbService.readPosts({skip: skip, size: PAGE_SIZE});
			return posts;
		}
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getIndexPage()');
	}
}


/**
 * Get the post data from database
 * @param {string} postId The post id
 * @return {post object|null} The post data or null if the post doesn't exist.
 */
async function getPost(postId){
	try{
		const post = await dbService.readPost(postId);
		return post;
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getPost()');
	}
}

/**
 * A function wrapper for getTrendsPage() with monthly range.
 * @param {number} page The page number
 */
async function getMonthlyTrendsPage(page = 1){
	try{
		const range = 30;
		return await getTrendsPage({page, range});
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getWeeklyTrendsPage()');
	}
}


/**
 * A function wrapper for getTrendsPage() with weekly range.
 * @param {number} page The page number
 */
async function getWeeklyTrendsPage(page = 1){
	try{
		const range = 7;
		return await getTrendsPage({page, range});
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getWeeklyTrendsPage()');
	}
}


/**
 * Serve the trends page.
 * @param {number} range Range in day for this query.
 * @param {number} page The page number.
 */
async function getTrendsPage({range = 1, page = 1} = {}){	
	// secure data
	range = parseInt(range, 10);
	range = (range < 0 || isNaN(range))? 7: range;
	page = parseInt(page, 10);
	page = (page < 0 || isNaN(page))? 1: page;

	try{
		const timeOffset = new Date().setDate(new Date().getDate() - range);
		const posts = await dbService.readPosts({
			query: {createdAt: { $gte: new Date(timeOffset) }},
			order: {viewCount: -1},
			size: PAGE_SIZE,
			skip: PAGE_SIZE * (page - 1)
		});
		return posts;
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getTrendsPage()');
	}
}


/**
 * Update the preload list.
 * This function will get posts from database and save to the preload list 
 * in order to accelerate page loading speed.
 */
async function updatePreloadList(){
	try{
		let preloadListSize = parseInt(config.preloadSize, 10);
    let posts = await dbService.readPosts({size: preloadListSize, skip: 0});
    if(posts){
      preloadList.update(posts);
    }else{
      throw new Error(`Error in updatePreloadList. It should contain certain results.`);
    }
	}catch(ex){
		log.error({ex: ex.stack}, 'Error in main-service.updatePreloadList()');
	}
}


/**
 * 
 * @param {string} postId 
 * @return {boolean} true if process finished successfully. 
 */
async function updatePostViewCount(postId){
	try{
		return await dbService.updatePostViewCount({postId: postId});
	}catch(ex){
		log.error({postId: postId, ex: ex.stack}, 'Error in main-service.updatePostViewCount()');
	}
}


async function buildPosts(pageIndex){
	if(!Number.isInteger(pageIndex)){
		return false;
	}
	try{
		const url = 'https://www.ptt.cc/bbs/Beauty/index' + pageIndex + '.html';
		daemon.send({cmd: 'buildPosts', url: url});
		return true;
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.buildPosts().');
		return false;
	}
}

module.exports.getIndexPage = getIndexPage;
module.exports.getPost = getPost;
module.exports.getTrendsPage = getTrendsPage;
module.exports.getWeeklyTrendsPage = getWeeklyTrendsPage;
module.exports.getMonthlyTrendsPage = getMonthlyTrendsPage;
module.exports.updatePostViewCount = updatePostViewCount;
module.exports.buildPosts = buildPosts;
