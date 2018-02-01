
/**
 * Project Beautyland
 * Main service
 * @author Roy Lu(royvbtw)
 * Sep 2017 -
 */


const config = require('../config/main.config');
const logSettings = (config.env === 'production')? [
  {level: config.LOG_LEVEL, path: 'log/main.log'}, 
  {level: 'error', path: 'log/error.log'}
]: [
  {level: 'debug', stream: process.stdout},
  {level: 'debug', path: 'log/debug.log'},
  {level: 'error', path: 'log/error.log'}
];

const log = require('bunyan').createLogger({
  name: 'accesslog',
  streams: logSettings
});


const dbConfig = require('../config/db.config');
let dburl = (config.env === 'production')? dbConfig.mainDbUrl: config.testDbUrl;
const dbService = require('../services/database-service').init(dburl);

const PAGE_SIZE = Number(config.defaultPageSize);

let daemonService = null;

const init = (async ( {daemon} = {}) => {
  await dbService.connect();
  daemonService = daemon;
  //await updatePreloadList();
})();


/**
 * Main handler for a request to index page
 * @param {number} page page number
 */
async function getIndexPage(page = 1){
  try{
    if(!dbService){ throw new Error('dbService does not exist'); }

    log.info(`getIndexPage() started. page=${page}`);

    page = parseInt(page, 10);
    page = (page < 0 || isNaN(page))? 1: page;

    const skip = (page - 1) * PAGE_SIZE;
    const posts = await dbService.readPosts({
      query: {visibility: true},
      skip: skip, 
      size: PAGE_SIZE
    });
    return posts;
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getIndexPage()');
	}
}


/**
 * Handler for GET /posts/:postId
 * Get the post data from database service and update its view count if the post exists
 */
async function getPostHandler(req, res, next){
  try{
    if(!dbService){ throw new Error('dbService does not exist'); }

    const postId = req.params.postId;
    const key = req.get('secret-key');
    let isAdmin = false;

    log.info(`GET /post/${postId}: key=${key}`);

    if(key === config.secretKey){
      isAdmin = true;
    }

    const post = await dbService.readPost(postId, {isAdmin});
    if(post){
      // Return the result first, update the view count later
      post.viewCount += 1;    // That why we have to add 1 to the view count
      res.status(200).json(post);
      await dbService.updatePostViewCount(postId);
    }else{
      return res.status(404).json({message: 'No any result.'});
    }
  }catch(ex){
    log.error({postId: req.params.postId, ex: ex.stack}, 'Error in service GET /posts/:postId');
    return res.sendStatus(500);
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
 * Get random posts from database. It will only return visible posts.
 */
async function getRandomPosts(){
  try{
    const posts = await dbService.readRandomPosts({
      size: PAGE_SIZE
    });
    return posts;
  }catch(ex){
    log.error({args: arguments, ex: ex.stack}, 'Error in main-service.getRandomPosts()');
  }
}


/**
 * PUT '/post/:postId'
 * Update the post: set visibility
 */
async function updatePostHandler(req, res, next){
  try{
    if(!dbService){
      throw new Error('dbService does not exist');
    }

    const postId = req.params.postId;
    const visibility = req.body.visibility;
    const key = req.get('secretKey');
    if(key !== config.secretKey){
      return res.status(401).json({message: 'Invalid action.'});
    }

    const isExists = await dbService.checkPostExists(postId);
    if(!isExists){
      return res.status(404).json({message: 'The post does not exist'});
    }

    log.info(`updatePostHandler: visibility=${visibility}`);

    const flag = await dbService.updatePostVisibility({ postId, visibility });
    if(flag){
      return res.status(200).json({message: 'The view count updated.'});
    }else{
      return res.status(500).json({message: 'Oops. There is something wrong.'});
    }
  }catch(ex){
    log.error({postId: req.params.postId, ex: ex.stack}, 'Error in put>post/:postId');
    return res.sendStatus(500);
  }
}


async function buildPosts(pageIndex){
	if(!Number.isInteger(pageIndex)){
		return false;
	}
	try{
		const url = 'https://www.ptt.cc/bbs/Beauty/index' + pageIndex + '.html';
		daemonService.send({cmd: 'buildPosts', url: url});
		return true;
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in main-service.buildPosts().');
		return false;
	}
}



/**
 * Turn on the visibility of a given post
 */
async function enablePostVisibility(req, res, next){
  try{
    if(!dbService){
      throw new Error('dbService does not exist');
    }

    const postId = req.params.postId;
    const key = req.get('secret-key');
    if(key !== config.secretKey){
      return res.status(401).json({message: 'Invalid action.'});
    }

    const isExists = await dbService.checkPostExists(postId);
    if(!isExists){
      return res.status(404).json({message: 'The post does not exist'});
    }

    const flag = await dbService.updatePostVisibility(postId, true);
    if(flag){
      log.info(`enablePostVisibility(): success`);
      return res.status(200).json({message: 'Visibility enabled.'});
    }else{
      return res.status(500).json({message: 'Oops. There is something wrong.'});
    }
  }catch(ex){
    log.error({
      postId: req.params.postId, 
      ex: ex.stack
    }, 'Error in service.enablePostVisibility()');
    return res.sendStatus(500);
  }
}


/**
 * Turn off the visibility of a given post
 */
async function disablePostVisibility(req, res, next){
  try{
    if(!dbService){
      throw new Error('dbService does not exist');
    }

    const postId = req.params.postId;
    const key = req.get('secret-key');
    if(key !== config.secretKey){
      return res.status(401).json({message: 'Invalid action.'});
    }

    const isExists = await dbService.checkPostExists(postId);
    if(!isExists){
      return res.status(404).json({message: 'The post does not exist'});
    }

    const flag = await dbService.updatePostVisibility(postId, false);
    if(flag){
      log.info(`disablePostVisibility(): success`);
      return res.status(200).json({message: 'Visibility disabled.'});
    }else{
      return res.status(500).json({message: 'Oops. There is something wrong.'});
    }
  }catch(ex){
    log.error({postId: req.params.postId, ex: ex.stack}, 'Error in service.disablePostVisibility()');
    return res.sendStatus(500);
  }
}


async function deletePostHandler(req, res, next){
  try{
    const key = req.get('secret-key');
    if(key !== config.secretKey){
      return res.status(401).json({message: 'Invalid action.'});
    }

    const postId = req.params.postId;
    const flag = await dbService.deletePost(postId);
    if(flag){
      return res.status(200).json({message: 'Post was deleted.'});
    }else{
      return res.status(404).json({message: 'The post does not exist.'});
    }
  }catch(ex){
    log.error({postId: req.params.postId, ex: ex.stack}, 'Error in main.put>post/:postId');
    return res.sendStatus(500);
  }
}

module.exports = init;

module.exports.getIndexPage = getIndexPage;
module.exports.getPostHandler = getPostHandler;
module.exports.getTrendsPage = getTrendsPage;
module.exports.getWeeklyTrendsPage = getWeeklyTrendsPage;
module.exports.getMonthlyTrendsPage = getMonthlyTrendsPage;
module.exports.getRandomPosts = getRandomPosts;
module.exports.updatePostHandler = updatePostHandler;
module.exports.buildPosts = buildPosts;
module.exports.deletePostHandler = deletePostHandler;
module.exports.enablePostVisibility = enablePostVisibility;
module.exports.disablePostVisibility = disablePostVisibility;
