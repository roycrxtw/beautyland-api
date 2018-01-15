
/**
 * Project Beautyland
 * Database service: Handle database relative actions
 * @author Roy Lu
 */

const MongoClient = require('mongodb').MongoClient;

const config = require('../config/main.config');
const connectionOptions = {
  keepAlive: 300000,
  connectTimeoutMS: 50000,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 2000
};

let logSettings = (config.env === 'production')? [
  {level: config.LOG_LEVEL, path: 'log/db.log'}, 
  {level: 'error', path: 'log/error.log'}
]: [
  {level: 'debug', stream: process.stdout},
  {level: 'debug', path: 'log/db.log'}
];

const log = require('bunyan').createLogger({
  name: 'db',
  streams: logSettings
});



class DatabaseService{
  constructor(url){
    this.dburl = url;
    this.conn = null;
    this.postsCollection = null;
    this.instanceId = Date.now();
  }

  async connect(){
    if(!this.conn){
      try{
        this.conn = await MongoClient.connect(this.dburl, connectionOptions);
        if(config.env === 'production'){
          this.postsCollection = this.conn.collection('posts');
        }else{
          this.postsCollection = this.conn.collection('test-posts');
        }
        log.info('DatabaseService.connect() finished.');
      }catch(ex){
        log.error({ex: ex.stack}, 'Error in database-service.connect()');
      }
    }
  }

  close(force = false){
    this.conn.close();
  }


  info(){
    return {
      isConnected: (this.conn)? true: false,
      dburl: this.dburl
    };
  }

  /**
   * @param {string} postId The post id
   * @return {Promise<boolean>} Resolve true if the post exists.
   */
  checkPostExists(postId){
    return new Promise( (resolve, reject) => {
      if(!this.conn){
        return reject('Database connection does not exist.');
      }

      this.postsCollection.findOne({postId: postId}, function(err, doc){
        if(err){
          return reject(err);
        }
        if(doc){	// found a post
          return resolve(true);
        }else{		// doesn't find a post
          return resolve(false);
        }
      });
    });
  }

  isConnected(){
    return (this.conn)? true: false;
  }

  async savePost(preparedPost){
    //return new Promise( (resolve, reject) => {
    try{
      if(!this.conn){
        //return reject('Database connection does not exist.');
        throw new Error('Database connection does not exist.');
      }

      const isExists = await this.postsCollection.findOne({postId: preparedPost.postId});
      if(isExists){
        return false;     // The post already exists
      }

      const result = await this.postsCollection.insertOne(preparedPost);
      if(result && result.result.n === 1){
        log.info(`Post[${preparedPost.postId}] saved.`);
        //return resolve({ok: 1});
        return true;
      }else{
        throw new Error({
          result,
          message: 'Error after insertOne in db.savePost()'
        });
      }
    }catch(ex){
      log.error({
        ex, args: arguments, ex: ex.stack
      }, 'Error in db-service.updatePostViewCount()');
    }
  }

  /**
   * Read post from database.
   * @param {string} postId The post id
   * @return {post|null} The found post, or null if there is no result for the given postId.
   */
  readPost(postId){
    return new Promise( (resolve, reject) => {
      if(!this.conn){
        return reject('Database connection does not exist.');
      }

      this.postsCollection.findOne({postId: postId}, {fields: {_id: 0}}, 
          function(err, doc){
        if(err){
          return reject(err);
        }
        if(doc){	// found a post
          return resolve(doc);
        }else{		// no any post, resolve null
          return resolve(null);
        }
      });
    });
  }


  readPosts({query = {}, order = {createdAt: -1}, size = 10, skip = 0} = {}){		
    return new Promise( (resolve, reject) => {
      if(!this.conn){
        return reject('Database connection does not exist.');
      }
      this.postsCollection.find(query).sort(order).skip(skip)
          .limit(size).project({_id: 0}).toArray(function(err, docs){
        if(err){
          return reject(err);
        }
        if(docs.length > 0){
          return resolve(docs);
        }else{    // no any result, resolve null
          return resolve(null);
        }
      });
    });
  }

  readRandomPosts({size = 20} = {}){
    return new Promise( async (resolve, reject) => {
      if(!this.conn){
        return reject('Database connection does not exist.');
      }

      try{
        const docs = await this.postsCollection.aggregate([{
          $sample: {size}
        }]).toArray();
        return resolve(docs);
      }catch(ex){
        return reject(ex);
      }
    });
  }


  deletePost(postId){
    return new Promise( (resolve, reject) => {
      if(!this.conn){
        return reject('Db does not exist.');
      }
      this.postsCollection.deleteOne({postId: postId}, function(err, result){
        if(err){
          return reject(err);
        }
        if(result.result.ok === 1 && result.result.n === 1){
          //return resolve({ok: 1, n: result.result.n});
          return resolve(true);
        }else{    // the post does not exist. Delete nothing
          return resolve(false);
          //return reject('Something wrong in database-service.deletePost(): result=', result);
        }
      });
    });
  }


  async updatePostViewCount({postId} = {}){
    try{
      const r = await this.postsCollection.findOneAndUpdate(
        {postId: postId},  {$inc: {viewCount: 1}}, {returnOriginal: false}
      );

      if(r.ok && r.value){
        return true;
      }else{
        return false;
      }
    }catch(ex){
      log.error({args: arguments, ex: ex.stack}, 'Error in db-service.updatePostViewCount()');
      return false;
    }
  }
}

let instance = null;

const init = (url) => {
  instance = new DatabaseService(url);
  return instance;
};

module.exports.init = init;



// var instance = null;

// module.exports = async function(url){
// 	try{
// 		if(!instance || !instance.isConnected){
// 			log.debug(`Now trying to instance a database.`);
// 			instance = new DatabaseService(url);
// 			await instance.connect();
// 			log.debug(`Database instanec created.`);
// 		}
// 		return instance;
// 	}catch(ex){
// 		log.error({ex: ex.stack}, 'Error in module.exports');
// 		return null;
// 	}
// };

// module.exports.getInstance = function(source){
//   if(instance){
//     return instance;
//   }else{
//     throw new Error('Database service instance doesn\'t exist.');
//   }
// }