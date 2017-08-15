


/**
 * A default list which save the latest cached posts.
 * This list will be returned when client visits index page.
 */

'use strict';

var debug = require('debug')('preloadList');

var config = require('./config/main.config');
var pageSize = config.defaultPageSize;
var dbService = require('./database-service').getInstance('preload-list');

var log = require('bunyan').createLogger({
	name: 'preload-list',
	streams: [{
		level: config.LOG_LEVEL,
		path: 'log/main.log'
	}]
});

class PreloadList{
    constructor(){
        this.posts = [];
        this.max = config.preloadSize;
        this.updatedAt = undefined;
    }

    async update(){
        console.log('list: update')
        try{
            debug('PreloadList.update() started.');
            this.posts = await dbService.readPosts({size: this.max, skip: 0});
            this.updatedAt = new Date();
        }catch(ex){
            console.log(ex);
            log.error({ex: ex.stack}, 'Error in preload-list.update()');
        }
    }

    getList(page){
        debug('getList() started. page=%s, preloadList.size=%s', page, this.posts.length);
        let slicedPosts = [];
        if(page === 1){
            slicedPosts = this.posts.slice(0, 10);
        }else{
            slicedPosts = this.posts.slice(10, 20);
        }
        return {posts: slicedPosts, updatedAt: this.updatedAt};
    }

    getListSize(){
        return this.posts.length;
    }
}

var preloadList = new PreloadList();

module.exports = preloadList;