
/**
 * Beautyland project
 * Routers
 * @author Roy Lu(royxnatw)
 */

const express = require('express');
const router = express.Router();

const controller = require('./main-controller');
const log = require('services/log-service').init('accessLog');

// Accesslog middleware
// This middleware will log every possible client ips using bunyan module
router.use(function(req, res, next) {
  // ignore the request for favicon.ico
  if (req.path === '/favicon.ico') { return next(); }

	log.info({
    path: req.url,
    xReadIp: req.headers['x-real-ip'],
    xForwardFor: req.headers['x-forwarded-for'],
    remoteAddress: req.connection.remoteAddress,
    socketRemoteAddress: req.socket.remoteAddress,
  }, 'Access log');

  next();
});

router.get(['/', '/latest/:page?'], controller.getLatestPosts);
router.get(['/about', '/info'], controller.getInfo);
router.get('/readme', controller.readme);
router.get('/shuffle', controller.getShufflePosts);
router.get(['/trends/:page?', '/trends/monthly/:page?'], controller.getTrendsPage);
router.get('/trends/weekly/:page?', controller.getWeeklyTrendsPage);
router.get('/posts/:postId', controller.getPost);

/**
 * Update post view count for the specified post when received put request.
 */
router.put('/posts/:postId', controller.updatePost);
router.put('/posts/:postId/visibility', controller.setPostVisibility);

/**
 * A request to DELETE the post for the given post id
 */
router.delete('/posts/:postId', controller.deletePost);

/**
 * Build posts from Beauty board with the given page index.
 */
router.post('/transaction', controller.createTransaction);

// handle 404 issues
router.use(function(req, res, next) {
  //res.sendStatus(404);
  res.status(404).send('What do you look for?');
});

// Error handler middleware
router.use(function(err, req, res, next) {
  log.error('Error happened in routers');
  log.error('Error: ', err);
  res.send("很抱歉，暫時無法提供此服務，請稍後再試。" 
      + "The service is currently not available. Please try it later.");
});

module.exports = router;
