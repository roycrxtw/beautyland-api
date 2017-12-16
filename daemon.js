
/**
 * Project Beautyland
 * @author Roy Lu(royvbtw)
 * daemon service: This daemon service is responsible for fetch data from PTT Beauty board.
 */

var util = require('./util');
var listHandler = require('./list-handler');
var DatabaseService = require('./database-service');

const config = require('./config/main.config');
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

var log = require('bunyan').createLogger({
  name: 'daemon',
  streams: logSettings
});


module.exports.buildPosts = buildPosts;

let dbService = null;


/**
 * To build posts from the given url
 * @param {string} url Post list url
 */
async function buildPosts(url = BOARD_URL){
  try{
    if(!dbService){
      return false;
    }
    const pttContent = await util.loadHtml(url);

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
        log.debug('Post exists, do nothing.');
      }
    }
    // Send a command message to parent process(main-service) to update its preloadList
    process.send({cmd: 'update-preloadList'});
  }catch(ex){
    log.error({ex: ex.stack}, 'Error in daemon.buildPosts()');
  }
}


/**
 * This will et up its own database service. It doesn't share db connection with main-process.
 */
(async function run(){
  log.info('daemon.run() started.');
  try{
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
