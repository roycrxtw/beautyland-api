
/**
 * Beautyland project
 * Routers
 * @author Roy Lu(royvbtw)
 */

var express = require('express');
var router = express.Router();

const config = require('../config/main.config');
const service = require('./main-service');

let logSettings = {};
if(config.env === 'production'){
	logSettings = [
    {level: config.LOG_LEVEL, path: 'log/routers.log'}, 
    {level: 'error', path: 'log/error.log'}
  ];
}else{
  logSettings = [{level: 'debug', stream: process.stdout}];
}

var log = require('bunyan').createLogger({
	name: 'accesslog',
	streams: logSettings
});


// Accesslog middleware
// This middleware will log every possibie client ips using bunyan module
router.use(function(req, res, next){
  if(req.path === '/favicon.ico'){	// ignore the request for favicon.ico
    return next();
  }
	log.info({
    path: req.url, 
    xReadIp: req.headers['x-real-ip'],
    xForwardFor: req.headers['x-forwarded-for'],
    remoteAddress: req.connection.remoteAddress, 
    socketRemoteAddress: req.socket.remoteAddress
  }, 'Access log');

  next();
});


router.get(['/readme'], function(req, res, next){
  res.redirect(302, '/readme.html');
});


router.get(['/about', '/info'], (req, res, next) => {
	res.json({message: 'Beautyland API, author: Roy Lu(royvbtw) 2017 -2018. #1401T0310'});
});


router.get(['/', '/latest/:page?'], async function(req, res, next){
	try{
	  const page = (req.params.page)? parseInt(req.params.page, 10): 1;
    const posts = await service.getIndexPage(page);
    if(posts){
      return res.json(posts);
    }else{
      return res.json({message: 'There is no any result.'});
    }
	}catch(ex){
    log.error({page: req.params.page, ex: ex.stack}, 'Error in routers.get>latest');
    return res.sendStatus(500);
  }
});


router.get(['/trends/:page?', '/trends/monthly/:page?'], async (req, res, next) => {
  try{
	  const page = (req.params.page)? parseInt(req.params.page, 10): 1;
	  const posts = await service.getMonthlyTrendsPage(page);
	  if(posts){
      return res.json(posts);
    }else{
      return res.json({message: 'There is no any result.'});
    }
  }catch(ex){
	  log.error({page: req.params.page, ex: ex.stack}, 'Error in routers.get>/trends/monthly');
	  return res.sendStatus(500);
  }
});


router.get('/trends/weekly/:page?', async function(req, res, next){
  try{
	  const page = (req.params.page)? parseInt(req.params.page, 10): 1;
	  const posts = await service.getWeeklyTrendsPage(page);
	  if(posts){
      return res.json(posts);
    }else{
      return res.json({message: 'There is no any result.'});
    }
  }catch(ex){
	  log.error({page: req.params.page, ex: ex.stack}, 'Error in routers.get>/trends/weekly');
	  return res.sendStatus(500);
  }
});

router.get('/samples', async (req, res, next) => {
  try{
    const posts = await service.getRandomPosts(20);
    if(posts && posts.length > 0){
      return res.json(posts);
    }else{
      return res.json({message: 'There is no any result'});
    }
  }catch(ex){
    log.error({page: req.params.page, ex: ex.stack}, 'Error in routers.get>/samples');
	  return res.sendStatus(500);
  }
});


/**
 * Get the post data for the given post id.
 */
router.get('/post/:postId', async (req, res, next) => {
  try{
    const postId = req.params.postId;
    log.info(`get>/post/${postId}`);

    // call the main service to handler this request.
    // It will return an empty object {} when the post doesn't exist.
    const post = await service.getPost(postId);
    if(post){
      return res.json(post);
    }else{
      return res.status(404).json({message: 'No any result.'});
    }
  }catch(ex){
    log.error({postId: req.params.postId, ex: ex.stack}, 'Error in routers.get>/post/:postId');
    return res.sendStatus(500);
  }
});


/**
 * Update post view count for the specified post when recevied put request.
 */
router.put('/post/:postId', async function(req, res, next){
  try{
    const postId = req.params.postId;
    const flag = await service.updatePostViewCount(postId);
    if(flag){
      return res.status(200).send('ViewCount updating ok.');
    }else{
      return res.sendStatus(400);
    }
  }catch(ex){
    log.error({postId: req.params.postId, ex: ex.stack}, 'Error in routers.put>post/:postId');
    return res.sendStatus(500);
  }
});


/**
 * Build posts from Beauty board with the given page index.
 */
router.post('/build', async (req, res, next) => {
  try{
    const pageIndex = parseInt(req.body.pageIndex, 10);
    const flag = await service.buildPosts(pageIndex);
    if(flag){
      return res.status(200).send('Build request ok.');
    }else{
      return res.sendStatus(400);
    }
  }catch(ex){
    log.error({pageIndex: parseInt(req.body.pageIndex, 10), ex: ex.stack}, 'Error in routers.post>/build');
    return res.sendStatus(500);
  }
});


// handle 404 issues
router.use(function(req, res, next){
  //res.sendStatus(404);
  res.status(404).send('What do you look for?');
});

// Error handler middleware
router.use(function(err, req, res, next){
  log.error('Error happened in routers');
  log.error('Error: ', err);
  res.send("很抱歉，暫時無法提供此服務，請稍後再試。" 
      + "The service is currently not available. Please try it later.");
});

module.exports = router;
