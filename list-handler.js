
/**
 * Project Beautyland API
 * This is a html parser specially designed for the ptt contents.
 * @author Roy Lu
 * Sep 2017
 */

'use strict';

var debug = require('debug')('list-handler');
var request = require('request');
var cheerio = require('cheerio');

const config = require('./config/main.config');
var util = require('./util');

let logSettings = {};
if(config.env === 'production'){
	logSettings = [
    {level: config.LOG_LEVEL, path: 'log/list-handler.log'}, 
    {level: 'error', path: 'log/error.log'}
  ];
}else{
  logSettings = [{level: 'debug', stream: process.stdout}];
}

var log = require('bunyan').createLogger({
	name: 'list-handler',
	streams: logSettings
});

const BASE_URL = 'https://www.ptt.cc';
const patternImgurId = /(?:http|https):\/\/.*?imgur\.com\/([^ .\n/]+)/;
const imgurUrlPattern = /(?:http|https):\/\/.*?imgur\.com\/([^ \n?/]+)/g;

module.exports.generatePost = generatePost;
module.exports.getImgurId = getImgurId;
module.exports.getImgurUrlsFromText = getImgurUrlsFromText;
module.exports.getList = getList;
module.exports.getPostId = getPostId;


/**
 * Format imgur url to a https direct link.
 * @param {string} url An imgur url
 * @return {string} Formatted imgur URL, or returns null if it is invalid imgur url.
 */
function formatImgurUrl(url){
	const imgurId = getImgurId(url);
	if(imgurId === 'nomatch'){
		return null;
	}else{
		const formattedImgurUrl = 'https://i.imgur.com/' + imgurId + '.jpg';
		return formattedImgurUrl;
	}
}


/**
 * Get imgur image ID
 * @param {string} url An imgur url
 * @return {string} The matched imgur id, or **nomatch** if the url is imgur 
 * album, imgur gallery or any other invalid url.
 */
function getImgurId(url){
	const match = url.match(patternImgurId);
	if(!match){
		return 'nomatch';
	}else if(match[1] === 'a' || match[1] === 'gallery'){
		return 'nomatch';
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
 * @property {Date} createdAt
 * @property {object[]} images An array which contains every imgur urls, image width and height.
 */

/**
 * 
 * @param {string} postId 
 * @return {PreparedPost|false} Return false if no any image in the post.
 */
async function generatePost(postSummary){
	try{
		const html = (await util.loadHtml(postSummary.link)).body;
	
		const plainText = util.htmlToText(html);
		const imgurUrls = getImgurUrlsFromText(plainText);
		if(imgurUrls.length === 0){
			return false;	// No any image exists. Return false.
		}
		
		let imageList = [];
		for(let i = 0; i < imgurUrls.length; i++){
			let image = {};
			const formattedUrl = formatImgurUrl(imgurUrls[i]);
			if(!formattedUrl){
				continue;
			}
			image.url = formattedUrl;
			const imageInfo = await util.getImageSize(image.url);
			image.width = imageInfo.width;
			image.height = imageInfo.height;
			imageList.push( image );
		}
		if(imageList.length === 0){
			return false;
		}

		let preparedPost = postSummary;
		preparedPost.images = imageList;
		preparedPost.viewCount = 0;
		preparedPost.createdAt = new Date();
		return preparedPost;
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in list-handler.generatePost()');
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
