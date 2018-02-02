
/**
 * Project Beautyland API
 * This is a html parser specially designed for the ptt contents.
 * @author Roy Lu(royvbtw)
 * Sep 2017 -
 */

const cheerio = require('cheerio');

const config = require('../config/main.config');
const util = require('./util');

let logSettings = {};
if(config.env === 'production'){
  logSettings = [
    {level: config.LOG_LEVEL, path: 'log/list-handler.log'}, 
    {level: 'error', path: 'log/error.log'}
  ];
}else{
  logSettings = [{level: 'debug', stream: process.stdout}];
}

const log = require('bunyan').createLogger({
  name: 'list-handler',
  streams: logSettings
});

const BASE_URL = 'https://www.ptt.cc';
const imgurIdPattern = /(?:http|https):\/\/.*?imgur\.com\/([^ .\n/]+)/;
const imgurUrlPattern = /(?:http|https):\/\/.*?imgur\.com\/([^ \n?/]+)/g;

module.exports.generatePost = generatePost;
module.exports.getImgurId = getImgurId;
module.exports.getImgurUrlsFromText = getImgurUrlsFromText;
module.exports.getList = getList;
module.exports.getPostId = getPostId;
module.exports.formatImgurUrl = formatImgurUrl;


/**
 * Format imgur url to a https direct link.
 * @param {string} url An imgur url
 * @return {string|null} Formatted imgur URL, or returns null if it is invalid imgur url.
 */
function formatImgurUrl(url){
  const imgurId = getImgurId(url);
  if(!imgurId){
    return null;
  }else{
    return 'https://i.imgur.com/' + imgurId + '.jpg';
  }
}


/**
 * Get imgur image ID
 * @param {string} imgurURL An imgur url
 * @return {string|false} The matched imgur id, or **false** if the url is imgur 
 * album, imgur gallery or any other invalid url.
 */
function getImgurId(imgurURL){
  const match = imgurURL.match(imgurIdPattern);
  if(!match || match[1] === 'a' || match[1] === 'gallery'){
    return false;
  }else{
    return match[1];
  }
}


/**
 * Get all imgur urls from the given plain text content.
 * @param {string} text plain text
 * @return {string[]} A url array parsed from the given plain text
 */
function getImgurUrlsFromText(text){
  let urls = text.match(imgurUrlPattern);
  if(!urls){
    urls = [];
  }
  return urls;
}


/**
 * @typedef {object} PreparedPost
 * @property {string} postId The Post id
 * @property {string} author The post author
 * @property {string} title Post title
 * @property {number} viewCount
 * @property {boolean} visibility
 * @property {Date} createdAt
 * @property {object[]} images An array which contains every imgur urls, image width and height.
 */

/**
 * 
 * @param {string} postId 
 * @return {PreparedPost|null} Return null if there is no any image in the post.
 */
async function generatePost(postSummary){
  try{
    const html = (await util.fetchHtml(postSummary.link)).body;
    
    const plainText = util.htmlToText(html);
    const imgurUrls = getImgurUrlsFromText(plainText);
    if(imgurUrls.length === 0){
      return null;  //No any image exists. Return null.
    }
    
    let imageList = [];
    for(let i = 0; i < imgurUrls.length; i++){
      const formattedUrl = formatImgurUrl(imgurUrls[i]);
      if(!formattedUrl){
        continue;
      }

      let image = {};
      image.url = formattedUrl;
      const imageInfo = await util.getImageSize(image.url);
      image.width = imageInfo.width;
      image.height = imageInfo.height;
      imageList.push(image);
    }
    
    if(imageList.length === 0){
      return null;
    }

    let preparedPost = {...postSummary};
    preparedPost.images = imageList;
    preparedPost.viewCount = 0;
    preparedPost.createdAt = new Date();
    preparedPost.visibility = true;
    return preparedPost;
  }catch(ex){
    log.error({args: arguments, ex: ex.stack}, 'Error in list-handler.generatePost()');
    return null;
  }
}


/**
 * Get post id from the given PTT url
 * @param {string} url a PTT url
 */
function getPostId(url){
  const pattern = /^.*\/(.*)\.html$/;
  const postId = url.match(pattern)[1];
  return postId;
}


/**
 * Build a list of post summary(post author, post id, link and title) 
 * from a PTT html content.
 * @param {string} htmlContent PTT html content
 * @return {array} A list of post summary
 */
function getList(htmlContent){
  let $ = cheerio.load(htmlContent);
  let list = [];

  $('.r-ent').each(function(index, value) {
    let postSummary = {};

    let path = $(this).find('a').attr('href');
    if(path){
      postSummary.link = BASE_URL + path;
    }else{
      return;
    }

    postSummary.author = $(this).find('.author').text();
    
    let temp = $(this).find('.title').text();
    postSummary.title = temp.trim().replace(/[\t\n\r]/g, '');
    if(postSummary.title.match(/^\[(公告|帥哥)\].*$/)){  // exclude '公告' and'帥哥'
      return;
    }
    
    postSummary.postId = getPostId(path);

    list.push(postSummary);
  });
  return list;
}
