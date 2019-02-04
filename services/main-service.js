
/**
 * Project Beautyland
 * Main service
 * @author Roy Lu(royxnatw)
 * Sep 2017 - 2019
 */

const config = require('config/main-config');
const log = require('services/log-service').init('main-service');

const Db_URL = config.db.url;
const dbService = require('services/database-service').init(Db_URL);
const PAGE_SIZE = config.defaultPageSize;

let daemonService = null;

async function init({daemon} = {}) {
	log.info(`Main-service: init started`);
  await dbService.connect();
	daemonService = daemon;
	log.info('main-service.init() finished. daemonService');
};

/**
 * Main handler for a request to index page
 * @param {number} page page number
 */
async function getIndexPage(page = 1) {
  try {
    if (!dbService) throw new Error('dbService does not exist');

    log.info(`getIndexPage() started. page=${page}`);

    page = parseInt(page, 10);
    page = (page < 0 || isNaN(page)) ? 1 : page;

    const skip = (page - 1) * PAGE_SIZE;
    const posts = await dbService.readPosts({
      query: {visibility: true},
      skip: skip,
      size: PAGE_SIZE,
    });
    return posts;
	} catch (ex) {
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getIndexPage()');
	}
}

/**
 * A function wrapper for getTrendsPage() with monthly range.
 * @param {number} page The page number
 */
async function getMonthlyTrendsPage(page = 1) {
	try {
		const range = 30;
		return await getTrendsPage({page, range});
	} catch(ex) {
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getMonthlyTrendsPage()');
	}
}

/**
 * A function wrapper for getTrendsPage() with weekly range.
 * @param {Number} page The page number
 */
async function getWeeklyTrendsPage(page = 1) {
  try {
    const range = 7;
    return await getTrendsPage({page, range});
  } catch(ex) {
    log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getWeeklyTrendsPage()');
  }
}


/**
 * Serve the trends page.
 * @param {number} range Range in day for this query.
 * @param {number} page The page number.
 */
async function getTrendsPage({range = 1, page = 1} = {}) {	
	try {
		const timeOffset = new Date().setDate(new Date().getDate() - range);
		const posts = await dbService.readPosts({
			query: {
				visibility: true,
				createdAt: {
					$gte: new Date(timeOffset)
				}
			},
			order: {viewCount: -1},
			size: PAGE_SIZE,
			skip: PAGE_SIZE * (page - 1)
		});
		return posts;
	} catch(ex) {
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getTrendsPage()');
	}
}

/**
 * Get random posts from database. It will only return visible posts.
 */
async function getRandomPosts(size = PAGE_SIZE) {
  try {
    const posts = await dbService.readRandomPosts({
      size,
    });
    return posts;
  } catch(ex) {
    log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getRandomPosts()');
  }
}

async function buildPost(url) {
	try {
		daemonService.send({cmd: 'buildPost', url});
		return {ok: true, msg: 'Build request sent.'};
	} catch(ex) {
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.buildPost().');
		return false;
	}
}

async function buildPosts(pageIndex) {
	if (!Number.isInteger(pageIndex)) {
		return false;
	}
	try {
		const url = 'https://www.ptt.cc/bbs/Beauty/index' + pageIndex + '.html';
		daemonService.send({cmd: 'buildPosts', url});
		return {ok: true, msg: 'Build request sent.'};
	} catch(ex) {
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.buildPosts().');
		return false;
	}
}

module.exports.init = init;
module.exports.buildPost = buildPost;
module.exports.buildPosts = buildPosts;
module.exports.getIndexPage = getIndexPage;
module.exports.getTrendsPage = getTrendsPage;
module.exports.getWeeklyTrendsPage = getWeeklyTrendsPage;
module.exports.getMonthlyTrendsPage = getMonthlyTrendsPage;
module.exports.getRandomPosts = getRandomPosts;
