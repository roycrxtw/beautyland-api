
/**
 * A preload post list which save the latest cached posts.
 * This design is trying to accelerate page loading at the first 2 pages.
 * @author Roy Lu
 * Sep, 2017
 */

const config = require('./config/main.config');
const PAGE_SIZE = config.defaultPageSize;

class PreloadList{
  constructor(){
    this.posts = [];
    this.max = config.preloadSize;
    this.updatedAt = undefined;
  }

  update(list){
    this.posts = list;
    this.updatedAt = new Date();
  }

  getList(page){
    let slicedPosts = [];
    if(page === 1){
        slicedPosts = this.posts.slice(0, PAGE_SIZE);
    }else{
        slicedPosts = this.posts.slice(PAGE_SIZE, this.max);
    }
    return {posts: slicedPosts, updatedAt: this.updatedAt};
  }

  getListSize(){
    return this.posts.length;
  }
}

const preloadList = new PreloadList();

module.exports = preloadList;