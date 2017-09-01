
/**
 * Project Beautyland API
 * This handler parse ptt contents to formatted data
 * @author Roy Lu
 */

'use strict';

var debug = require('debug')('list-handler');
var request = require('request');
var cheerio = require('cheerio');

var config = require('./config/main.config');
var util = require('./util');

var log = require('bunyan').createLogger({
	name: 'list-handler',
	streams: [{
		level: config.LOG_LEVEL,
		path: 'log/list-handler.log'
	}]
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
 * @param {string} url Target imgur url
 * @return {string} Formatted imgur URL, or null if it is invalid imgur url.
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
 * @param {string} url imgur url
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
 * Get imgur urls from plain text content.
 * @param {string} text plain text
 * @return {string[]} urls A url array parsed from plain text
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
 * @property {string} postDate
 * @property {number} clickCount
 * @property {string} createdAt
 * @property {string[]} imgUrls An array which is saved every imgur urls 
 */

/**
 * 
 * @param {string} postId 
 * @return {PreparedPost|false} Return false if no any image in the post.
 */
async function generatePost(postSummary){
	try{
		let html = (await util.loadHtml(postSummary.link)).body;
	
		let plainText = util.htmlToText(html);
		let imgurUrls = getImgurUrlsFromText(plainText);
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

		let preparedPost = postSummary;
		preparedPost.images = imageList;
		preparedPost.clickCount = 0;
		preparedPost.createdAt = new Date();
		return preparedPost;
	}catch(ex){
		log.error({args: arguments, ex: ex.stack}, 'Error in list-handler.generatePost()');
	}
}


/**
 * Get post id from specified PTT url
 * @param {string} url PTT url
 */
function getPostId(url){
	const pattern = /^.*\/(.*)\.html$/;
	const postId = url.match(pattern)[1];
	return postId;
}


/**
 * Get all post summary from a PTT html content.
 * @param {string} htmlContent PTT html content
 * @return {array} An array of post summary
 */
function getList(htmlContent){
	let $ = cheerio.load(htmlContent);
	let list = [];
	let author = '', path = '';
	$('.r-ent').each(function(index, value) {
		let postSummary = {};

		let path = $(this).find('a').attr('href');
		if(path){
			postSummary.link = BASE_URL + path;
		}else{
			return true;
		}

		postSummary.author = $(this).find('.author').text();
		let temp = $(this).find('.title').text();
		postSummary.title = temp.replace(/[\t\n\r]/g, '');
		postSummary.postId = getPostId(path);

		list.push(postSummary);
	});
	return list;
}
