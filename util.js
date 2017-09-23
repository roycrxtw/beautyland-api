
/**
 * Project Beautyland API
 * @author Roy Lu
 * Sep, 2017
 */


'use strict';

var debug = require('debug')('util');
var cheerio = require('cheerio');
var request = require('request');
var requestImageSize = require('request-image-size');

var log = require('bunyan').createLogger({
	name: 'util',
	streams: [
    {level: 'error', path: 'log/error.log'}
  ]
});

module.exports.loadHtml = loadHtml;
module.exports.htmlToText = htmlToText;
module.exports.getImageSize = getImageSize;


/**
 * Get target html content for the specified url
 * @param {string} url The target url which will be processed.
 * @return {Promise} Resolve if status code is 200 and the length of html content > 0.
 */
function loadHtml(url){
	return new Promise( (resolve, reject) => {
		request(url, function(err, response, body){
			if(err){
				return reject({error: err, url: url});
			}
			const statusCode = response.statusCode;
			if(response && statusCode === 200 && body.length > 0){
				return resolve({statusCode: statusCode, body: body});
			}else if(response && statusCode === 200 && body.length === 0){
				return reject({
					message: 'Content length is 0 after loadHtml(). Please check.', 
					statusCode: statusCode,
					url: url
				});
			}else{
				return reject({
					message: 'Wrong status code', 
					statusCode: statusCode,
					url: url
				});
			}
		});
	});
}

/**
 * A utility which is used to parse html content to plain text.
 * @param {string} html Plain text of html content.
 */
function htmlToText(html){
	if(html.length === 0){
		return false;
	}
	let $ = cheerio.load(html);
	return $('body').text();
}


/**
 * Get image width and height data for the given url.
 * It uses request-image-size module.
 * @param {string} url 
 */
async function getImageSize(url){
	try{
		return await requestImageSize(url);
	}catch(ex){
		log.error({url: url, ex: ex.stack}, 'Error in util.getImageSize()');
	}
}