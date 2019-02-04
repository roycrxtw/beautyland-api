
/**
 * Project Beautyland
 * @author Roy Lu(royxnatw)
 * daemon service: This daemon service is responsible for fetch data from PTT Beauty board.
 */

const util = require('./util');
const listHandler = require('./list-handler');

const config = require('config/main-config');
const dbService = require('services/database-service').init(config.db.url);

const BOARD_URL = config.boardUrl;
const PERIOD = config.fetchPeriod;

const log = require('services/log-service').init('daemon');

module.exports.buildPost = buildPost;
module.exports.buildPosts = buildPosts;

/**
 * This will setup its own database service. It doesn't share db connection with main-process.
 */
(async function run() {
  log.info('daemon.run() started.');
  try {
    await dbService.connect();

    while(true) { // run forever
      await buildPosts();
      await sleep(PERIOD);
    }
  } catch(ex) {
    log.error({ex: ex.stack}, 'Error in daemon.run()');
  }
})();

/**
 * To build a post from the given url
 * @param {String} url The url of the PTT.beauty web post
 */
async function buildPost(url) {
  try {
    if (!dbService) { // Do nothing if dbService does not set up
      log.error('The dbService does not exist.');
      return false;
    }

    if (!url) return false;

    log.info(`Trying to buildPost from url:`, url);

    const postSummary = {
      postId: listHandler.getPostId(url),
      link: url,
    };

    let preparedPost;
    const postExists = await dbService.checkPostExists(postSummary.postId);
    if (!postExists) {
      preparedPost = await listHandler.generatePost(postSummary);
      if (preparedPost) {
        await dbService.savePost(preparedPost);
      } else {
        // preparedPost did not generate, do nothing.
      }
    } else {
      log.debug(`Post [${postSummary.postId}] exists, do nothing.`);
    }
  } catch(ex) {
    log.error({ex: ex.stack}, 'Error in daemon.buildPost()');
  }
}


/**
 * To build posts from the given url
 * @param {string} url Post list url
 */
async function buildPosts(url = BOARD_URL) {
  try {
    if (!dbService) { // Do nothing if dbService does not set up
      log.error('The dbService does not exist.');
      return false;
    }

    log.info(`Trying to buildPosts from url:`, url);

    const pttContent = await util.fetchHtml(url);

    const list = listHandler.getList(pttContent.body);

    let preparedPost = null;
    for (let item of list) {
      const postExists = await dbService.checkPostExists(item.postId);
      if (!postExists) {
        preparedPost = await listHandler.generatePost(item);
        if (preparedPost) {
          await dbService.savePost(preparedPost);
        } else {
          // preparedPost did not generate, do nothing.
        }
      } else {
        log.debug(`Post [${item.postId}] exists, do nothing.`);
      }
    }
  } catch(ex) {
    log.error({ex: ex.stack}, 'Error in daemon.buildPosts()');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

process.on('message', async msg => {
  if (msg.cmd === 'buildPosts') {
    await buildPosts(msg.url);
  } else if (msg.cmd === 'buildPost') {
    await buildPost(msg.url);
  }
});
