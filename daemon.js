
/**
 * Project Beautyland
 * @author Roy Lu(royvbtw)
 * daemon service: This daemon service is responsible for fetch data from PTT Beauty board.
 */


'use strict';

var debug = require('debug')('daemon');

var util = require('./util');
var listHandler = require('./list-handler');
var DatabaseService = require('./database-service');
var config = require('./config/main.config');

const BORDER_URL = 'https://www.ptt.cc/bbs/Beauty/index.html';
const PERIOD = config.fetchPeriod;

var log = require('bunyan').createLogger({
	name: 'accesslog',
	streams: [
        {level: config.LOG_LEVEL, path: 'log/daemon.log'}, 
        {level: 'error', path: 'log/error.log'}
    ]
});


module.exports.buildPosts = buildPosts;

let dbService = null;


/**
 * 
 * @param {string} url Post list url
 */
async function buildPosts(url = BORDER_URL){
  try{
    if(!dbService){
      debug('dbService does not exist. exit buildPosts().');
      return false;
    }
    const pttContent = await util.loadHtml(url);

    let list = listHandler.getList(pttContent.body);

    let preparedPost = null;
    for(let i = 0; i < list.length; i++){
      debug('Processing item %s/%s. postId=%s', i, list.length, list[i].postId);
      let flag = await dbService.checkPostExists(list[i].postId);
      if(!flag){
        debug('Post does not exist in database, it needs to save to database');
        preparedPost = await listHandler.generatePost(list[i]);
        if(preparedPost){
          await dbService.savePost(preparedPost);
        }else{
          // preparedPost did not generate, do nothing.
        }
      }else{
        debug('Post exists, do nothing.');
      }
    }
    // Send a command message to parent process(main-service) to update its preloadList
    process.send({cmd: 'update-preloadList'});
  }catch(ex){
    log.error({ex: ex.stack}, 'Error in daemon.buildPosts()');
  }
}


(async function run(){
  log.info('daemon.run() started.');
  try{
    // Set up its own database service. It doesn't share db connection with main-process.
    dbService = await DatabaseService();
    while(true){    // run forever
      await buildPosts();
      await sleep(PERIOD);
    }
  }catch(ex){
    log.error({ex: ex.stack}, 'Error in daemon.run()');
  }
})();


function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}


process.on('message', async msg => {
  if(msg.cmd === 'buildPosts'){
    await buildPosts(msg.url);
  }
});
