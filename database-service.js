
/**
 * Project Beautyland
 * Database service: Handle database relative actions
 * @author Roy Lu
 */


'use strict';

var debug = require('debug')('db');

var MongoClient = require('mongodb').MongoClient;

var config = require('./config/main.config');
const DB_URL = 'mongodb://root:dbbl5566@ds031822.mlab.com:31822/beauty-land';
const connectionOptions = {
	keepAlive: 300000,
	connectTimeoutMS: 50000
}; 

var log = require('bunyan').createLogger({
	name: 'db',
	streams: [{
		level: config.LOG_LEVEL,
		path: 'log/db.log'
	}]
});

class DatabaseService{
	constructor(){
		this.conn = null;
	}
	
	async connect(){
		if(!this.conn){
			try{
				log.info('DatabaseService.connect(): Now trying to connect to database.');
				let db = await MongoClient.connect(DB_URL, connectionOptions);
				this.conn = db;
				log.info('DatabaseService.connect() finished.');
			}catch(ex){
				log.error({ex: ex.stack}, 'Error in database-service.connect()');
			}
		}else{
			debug('DatabaseService.connect(): Connection exists. Do nothing.');
		}
	}

	savePost(preparedPost, collectionName = 'posts'){
		return new Promise( (resolve, reject) => {
			if(!this.conn){
				return reject('Database connection does not exist.');
			}
			this.conn.collection(collectionName).insertOne(preparedPost, function(err, result){
				if(err){
					return reject(err);
				}
				if(result.result.n === 1){
					return resolve({ok: 1});
				}else{
					return reject('Wrong result.n=', result.result.n);
				}
			});
		});
	}

	checkPostExists(postId, collectionName = 'posts'){
		//debug('checkPostExists(): postId=%s, collectionName=%s', postId, collectionName);
		return new Promise( (resolve, reject) => {
			if(!this.conn){
				return reject('Database connection does not exist.');
			}
			this.conn.collection(collectionName).findOne({postId: postId}, function(err, doc){
				if(err){
					return reject(err);
				}
				if(doc){	// find a post
					return resolve(true);
				}else{		// Doesn't find a post
					return resolve(false);
				}
			});
		});
	}
	
	readPost(postId, collectionName = 'posts'){
		return new Promise( (resolve, reject) => {
			if(!this.conn){
				return reject('Database connection does not exist.');
			}
			this.conn.collection(collectionName).findOne({postId: postId}, function(err, doc){
				if(err){
					return reject(err);
				}
				if(doc){	// find a post
					return resolve(doc);
				}else{		// Doesn't find a post
					return resolve({message: 'No result.'});
				}
			});
		});
	}

	deletePost(postId, collectionName = 'posts'){
		return new Promise( (resolve, reject) => {
			if(!this.conn){
				return reject('Db does not exist.');
			}
			this.conn.collection(collectionName).deleteOne({postId: postId}, function(err, result){
				if(err){
					return reject(err);
				}
				if(result.result.ok === 1){
					return resolve({ok: 1, n: result.result.n});
				}else{
					return reject('Something wrong in database-service.deletePost(): result=', result);
				}
			});
		});
	}


	readPosts({query = {}, order = {createdAt: -1}, size = 10, skip = 0, collectionName = 'posts'} = {}){		
		return new Promise( (resolve, reject) => {
			if(!this.conn){
				return reject('Db does not exist.');
			}
			debug('readPosts, arguments=', arguments);
			this.conn.collection(collectionName).find(query).sort(order)
					.skip(skip).limit(size).toArray(function(err, docs){
				if(err){
					return reject(err);
				}
				if(docs){
					debug('Found %s docs.', docs.length);
					return resolve(docs);
				}else{
					return resolve({message: 'No results.'});
				}
			});
		});
	}

	isConnected(){
		return (this.conn)? true: false;
	}
}

var instance = null;

module.exports = async function(){
	try{
		if(!instance || !instance.isConnected){
			instance = new DatabaseService()
			await instance.connect();
		}
		return instance;
	}catch(ex){
		log.error({ex: ex.stack}, 'Error in module.exports');
		return null;
	}
};

module.exports.getInstance = function(source){
	if(instance){
		console.log('%s want to get instance, we will give them.', source);
		return instance;
	}else{
		console.log('%s want to get instance, but there is no instance.', source);
		throw new Error('Database service instance doesn\'t exist.');
	}
}