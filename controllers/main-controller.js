
/**
 * Project Beautyland
 * Main service
 * @author Roy Lu(royxnatw)
 * Sep 2017 -
 */

const config = require('config/main-config');
const log = require('services/log-service').init('main-controller');

const dbService = require('services/database-service').init(config.db.url);
const mainService = require('services/main-service');

// const PAGE_SIZE = config.defaultPageSize;

module.exports = {
  createTransaction,
  getInfo,
  getPost,
  getLatestPosts,
  getShufflePosts,
  getTrendsPage,
  getWeeklyTrendsPage,
  readme,
  // post related handlers
  updatePost,
  deletePost,
  setPostVisibility,
};

/**
 * Get readme
 */
function readme(req, res, next) {
  return res.redirect(302, '/readme.html');
}

async function getInfo(req, res, next) {
  return res.json({message: 'Beautyland API, author: Roy Lu(royxnatw) 2017 - 2019. #0204T2223.'});
}

/**
 * Handler for GET /posts/:postId
 * Get the post data from database service and update its view count if the post exists
 * TODO auth-middleware
 */
async function getPost(req, res, next) {
  try {
    if (!dbService) { throw new Error('dbService does not exist'); }

    const postId = req.params.postId;
    let isAdmin = false;

    const post = await dbService.readPost(postId, {isAdmin});
    if (post) {
      // Return the result first, update the view count later
      post.viewCount += 1;    // That why we have to add 1 to the view count
      res.status(200).json(post);
      await dbService.updatePostViewCount(postId);
    } else {
      return res.status(404).json({message: 'No any result.'});
    }
  } catch(ex) {
    log.error({postId: req.params.postId, ex: ex.stack}, 'Error in service GET /posts/:postId');
    return res.sendStatus(500);
  }
}

async function getLatestPosts(req, res, next) {
	try {
	  const page = (req.params.page) ? parseInt(req.params.page, 10) : 1;
    const posts = await mainService.getIndexPage(page);
    if (posts) {
      return res.json(posts);
    } else {
      return res.json(responseNoResult());
    }
	 } catch(ex) {
    log.error({page: req.params.page, ex: ex.stack}, 'Error in routers.get>/latest');
    return res.sendStatus(500);
  }
}

async function getShufflePosts(req, res, next) {
  try {
    const posts = await mainService.getRandomPosts(20);
    if (posts && posts.length > 0) {
      return res.json(posts);
    } else {
      return res.json(responseNoResult());
    }
  } catch(ex) {
    log.error({page: req.params.page, ex: ex.stack}, 'Error in routers.get>/samples');
	  return res.sendStatus(500);
  }
};

async function getTrendsPage(req, res, next) {
  try {
	  const page = (req.params.page) ? parseInt(req.params.page, 10) : 1;
	  const posts = await mainService.getMonthlyTrendsPage(page);
	  if (posts) {
      return res.json(posts);
    } else {
      return res.json(responseNoResult());
    }
  } catch(ex) {
	  log.error({page: req.params.page, ex: ex.stack}, 'Error in routers.get>/trends/monthly');
	  return res.sendStatus(500);
  }
}

/**
 * PUT '/post/:postId'
 * Update the post: set visibility
 */
async function updatePost(req, res, next) {
  try {
    if (!dbService) {
      throw new Error('dbService does not exist');
    }

    const postId = req.params.postId;
    const visibility = req.body.visibility;
    const key = req.get('secretKey');
    if (key !== config.secretKey) {
      return res.status(401).json({message: 'Invalid action.'});
    }

    const postExists = await dbService.checkPostExists(postId);
    if(!postExists) {
      return res.status(404).json({message: 'The post does not exist.'});
    }

    log.info(`updatePostHandler(): postId=${postId} visibility=${visibility}`);

    const flag = await dbService.updatePostVisibility({ postId, visibility });
    if (flag) {
      return res.status(200).json({message: 'The post visibility updated.'});
    } else {
      return res.status(500).json({message: 'Oops. There is something wrong.'});
    }
  } catch(ex) {
    log.error({postId: req.params.postId, ex: ex.stack}, 'Error in put>post/:postId');
    return res.sendStatus(500);
  }
}

/**
 * Turn on the visibility of a given post
 */
async function setPostVisibility(req, res, next) {
  try {
    if (!dbService) {
      throw new Error('dbService does not exist');
    }

    const postId = req.params.postId;
    const key = req.get('secret-key');
    const visibility = req.body.visibility;

    if (key !== config.secretKey) {
      return res.status(401).json({message: 'Invalid action.'});
    }
    
    if (typeof visibility !== 'boolean') {
      return res.status(400).json({message: 'Invalid parameter:visibility. It should be a boolean.'});
    }

    const isExists = await dbService.checkPostExists(postId);
    if (!isExists) {
      return res.status(404).json({message: 'The post does not exist'});
    }

    const flag = await dbService.updatePostVisibility(postId, true);
    if (flag) {
      log.info(`enablePostVisibility(): success`);
      return res.status(200).json({message: 'Visibility enabled.'});
    } else {
      return res.status(500).json({message: 'Oops. There is something wrong.'});
    }
  } catch(ex) {
    log.error({
      postId: req.params.postId, 
      ex: ex.stack
    }, 'Error in main-service.setPostVisibility()');
    return res.sendStatus(500);
  }
}


/**
 * Turn off the visibility of a given post
 */
// async function disablePostVisibility(req, res, next) {
//   try{
//     if(!dbService) {
//       throw new Error('dbService does not exist');
//     }

//     const postId = req.params.postId;
//     const key = req.get('secret-key');
//     if(key !== config.secretKey) {
//       return res.status(401).json({message: 'Invalid action.'});
//     }

//     const isExists = await dbService.checkPostExists(postId);
//     if(!isExists) {
//       return res.status(404).json({message: 'The post does not exist'});
//     }

//     const flag = await dbService.updatePostVisibility(postId, false);
//     if(flag) {
//       log.info(`disablePostVisibility(): success`);
//       return res.status(200).json({message: 'Visibility disabled.'});
//     } else {
//       return res.status(500).json({message: 'Oops. There is something wrong.'});
//     }
//   }catch(ex) {
//     log.error({postId: req.params.postId, ex: ex.stack}, 'Error in service.disablePostVisibility()');
//     return res.sendStatus(500);
//   }
// }

// TODO http auth
async function deletePost(req, res, next) {
  try {
    const key = req.get('secret-key');
    if (key !== config.secretKey) {
      return res.status(401).json({message: 'Invalid action.'});
    }

    const postId = req.params.postId;
    const flag = await dbService.deletePost(postId);
    if (flag) {
      return res.status(200).json({message: 'Post was deleted.'});
     } else {
      return res.status(404).json({message: 'The post does not exist.'});
    }
  } catch(ex) {
    log.error({postId: req.params.postId, ex: ex.stack}, 'Error in main.put>post/:postId');
    return res.sendStatus(500);
  }
}

// TODO Needs check
async function getWeeklyTrendsPage(req, res, next) {
  try {
	  const page = (req.params.page) ? parseInt(req.params.page, 10) : 1;
	  const posts = await mainService.getWeeklyTrendsPage(page);
	  if (posts) {
      return res.json(posts);
    } else {
      return res.json(responseNoResult());
    }
  } catch(ex) {
	  log.error({page: req.params.page, ex: ex.stack}, 'Error in routers.get>/trends/weekly');
	  return res.sendStatus(500);
  }
}

/**
 * Create a transaction for build post, etc.
 */
async function createTransaction(req, res, next) {
  try {
    log.debug(`body`, req.body);
    const type = req.body.type;
    const url = req.body.url;
    const pageIndex = parseInt(req.body.pageIndex, 10);
    log.info(`Trying to create a transaction`);

    let result;
    switch (type) {
      case 'list': result = await mainService.buildPosts(pageIndex); break;
      case 'post': result = await mainService.buildPost(url); break;
      default: return res.json('No such type');
    }

    if (result.ok) {
      return res.status(200).send(result.msg);
    } else {
      return res.sendStatus(400);
    }
  } catch(ex) {
    log.error({
      pageIndex: parseInt(req.body.pageIndex, 10), ex: ex.stack
    }, 'Error in routers.post>/build');
    return res.sendStatus(500);
  }
}

function responseNoResult() {
  return {message: 'There is no any result.'};
}
