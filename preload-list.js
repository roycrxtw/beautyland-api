
/**
 * A preload post list which save the latest cached posts.
 * This design is trying to accelerate 
 */

'use strict';

var debug = require('debug')('preloadList');

var config = require('./config/main.config');
var pageSize = config.defaultPageSize;

class PreloadList{
    constructor(){
        this.posts = [];
        this.max = config.preloadSize;
        this.updatedAt = undefined;
    }

    update(list){
        debug('update() started. list.length=', list.length)
        debug('update(): list[1]=', list[1]);
        this.posts = list;
        this.updatedAt = new Date();
        debug('Current preload-list size is %s', this.posts.length);
    }

    getList(page){
        debug('getList() started. page=%s, preloadList.size=%s', page, this.posts.length);
        let slicedPosts = [];
        if(page === 1){
            slicedPosts = this.posts.slice(0, config.defaultPageSize);
        }else{
            slicedPosts = this.posts.slice(config.defaultPageSize, this.max);
        }
        return {posts: slicedPosts, updatedAt: this.updatedAt};
    }

    getListSize(){
        return this.posts.length;
    }
}

var preloadList = new PreloadList();

module.exports = preloadList;