
/**
 * Beautyland project
 * @author Roy Lu
 */

'use strict';

var express = require('express'),
	router = express.Router();
var debug = require('debug')('routers');

var config = require('./config/main.config');
var service = require('./main-service');

var log = require('bunyan').createLogger({
	name: 'accesslog',
	streams: [{
		level: config.LOG_LEVEL,
		path: 'log/routers.log'
	}]
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

router.get('/info', function(req, res, next){
	res.json({message: 'This is Beautyland api, author: Roy Lu. Aug 2017. #0717'});
});

router.get(['/', '/latest/:page?'], async function(req, res, next){
	try{
		let page = (req.params.page)? parseInt(req.params.page): 1;
		let posts = await service.getIndexPage(page);
		return res.json(posts);
	}catch(ex){
		log.error({page: req.params.page, ex: ex.stack}, 'Error in routers.get>latest');
		return res.sendStatus(500);
	}
});

router.get('/trends/:page?', async function(req, res, next){
	try{
		let page = (req.params.page)? parseInt(req.params.page): 1;
		let posts = await service.getTrendsPage({range: 7, page: page});
		return res.json(posts);
	}catch(ex){
		log.error({page: req.params.arg, ex: ex.stack}, 'Error in routers.get>trends');
		return res.sendStatus(500);
	}
});


/**
 * Client will send request for this route. It works like a signal receiver.
 * The click count will be increased for that specific post.
 */
router.put('/post/:postId', async function(req, res, next){
	try{
		let postId = req.params.postId;
		let flag = await service.updatePostViewCount(postId);
		if(flag){
			return res.status(200).send('Update ok.');
		}else{
			return res.sendStatus(400);
		}
	}catch(ex){
		log.error({postId: postId, ex: ex.stack}, 'Error in routers.put>post/:postId');
		return res.sendStatus(500);
	}
});


// handle 404 issues
router.use(function(req, res, next){
	//res.sendStatus(404);
	res.send('What do you look for?');
});

// Error handler middleware
router.use(function(err, req, res, next){
	log.error('Error happened in routers');
	log.error('Error: ', err);
	res.send("很抱歉，暫時無法提供此服務，請稍後再試。" 
			+ "The service is currently not available. Please try it later.");
});

module.exports = router;