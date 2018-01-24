
/**
 * Project Beautyland
 * @author Roy Lu(royvbtw)
 * daemon service: This daemon service is responsible for fetch data from PTT Beauty board.
 */

const util = require('./util');
const listHandler = require('./list-handler');

const dbConfig = require('../config/db.config');
const dbService = require('./database-service').init(dbConfig.mainDbUrl);

const config = require('../config/main.config');
const BOARD_URL = config.boardUrl;
const PERIOD = config.fetchPeriod;

let logSettings = {};
if(config.env === 'production'){
  logSettings = [
    {level: config.LOG_LEVEL, path: 'log/daemon.log'}, 
    {level: 'error', path: 'log/error.log'}
  ];
}else{
  logSettings = [{level: 'debug', stream: process.stdout}];
}

const log = require('bunyan').createLogger({
  name: 'daemon',
  streams: logSettings
});


module.exports.buildPosts = buildPosts;


/**
 * This will set up its own database service. It doesn't share db connection with main-process.
 */
(async function run(){
  log.info('daemon.run() started.');
  try{
    await dbService.connect();

    while(true){    // run forever
      await buildPosts();
      await sleep(PERIOD);
    }
  }catch(ex){
    log.error({ex: ex.stack}, 'Error in daemon.run()');
  }
})();


/**
 * To build posts from the given url
 * @param {string} url Post list url
 */
async function buildPosts(url = BOARD_URL){
  try{
    if(!dbService){
      log.error('The dbService does not exist.');
      return false;
    }   // Do nothing if dbService does not set up

    const pttContent = await util.fetchHtml(url);

    let list = listHandler.getList(pttContent.body);

    let preparedPost = null;
    for(let i = 0; i < list.length; i++){
      const isExist = await dbService.checkPostExists(list[i].postId);
      if(!isExist){
        preparedPost = await listHandler.generatePost(list[i]);
        if(preparedPost){
          await dbService.savePost(preparedPost);
        }else{
          // preparedPost did not generate, do nothing.
        }
      }else{
        log.debug(`Post [${list[i].postId}] exists, do nothing.`);
      }
    }
    // Send a command message to parent process(main-service) to update its preloadList
    //process.send({cmd: 'update-preloadList'});
  }catch(ex){
    log.error({ex: ex.stack}, 'Error in daemon.buildPosts()');
  }
}


function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}


process.on('message', async msg => {
  if(msg.cmd === 'buildPosts'){
    await buildPosts(msg.url);
  }
});
